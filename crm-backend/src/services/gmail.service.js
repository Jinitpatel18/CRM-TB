import { google } from 'googleapis';
import { query } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { getAuthenticatedClient } from './googleAuth.service.js';

/**
 * Fetch recent unread messages from Gmail inbox.
 */
const fetchRecentMessages = async (maxResults = 50) => {
    const auth = await getAuthenticatedClient();
    const gmail = google.gmail({ version: 'v1', auth });

    const list = await gmail.users.messages.list({
        userId: 'me',
        q: 'in:inbox newer_than:7d -from:me',
        maxResults,
    });

    return list.data.messages || [];
};

/**
 * Fetch full message details.
 */
const fetchMessage = async (messageId) => {
    const auth = await getAuthenticatedClient();
    const gmail = google.gmail({ version: 'v1', auth });

    const res = await gmail.users.messages.get({
        userId: 'me',
        id: messageId,
        format: 'full',
    });

    return res.data;
};

/**
 * Parse headers into a map.
 */
const parseHeaders = (headers = []) => {
    const map = {};
    headers.forEach((h) => { map[h.name.toLowerCase()] = h.value; });
    return map;
};

/**
 * Extract plain-text body from payload (recursive for multipart).
 */
const extractBody = (payload) => {
    if (!payload) return '';

    // Simple text/plain
    if (payload.body?.data) {
        return Buffer.from(payload.body.data, 'base64').toString('utf-8');
    }

    // Multipart
    if (payload.parts) {
        for (const part of payload.parts) {
            if (part.mimeType === 'text/plain' && part.body?.data) {
                return Buffer.from(part.body.data, 'base64').toString('utf-8');
            }
        }
        // Fallback: html
        for (const part of payload.parts) {
            if (part.mimeType === 'text/html' && part.body?.data) {
                const html = Buffer.from(part.body.data, 'base64').toString('utf-8');
                return html.replace(/<[^>]+>/g, '').trim();
            }
        }
        // Nested
        for (const part of payload.parts) {
            const nested = extractBody(part);
            if (nested) return nested;
        }
    }

    return '';
};

/**
 * Extract email address from "Name <email@example.com>" format.
 */
const extractEmailAddress = (fromHeader = '') => {
    const match = fromHeader.match(/<(.+?)>/);
    return (match ? match[1] : fromHeader).trim().toLowerCase();
};

/**
 * Normalize subject by removing "Re:", "Fwd:", etc.
 */
const normalizeSubject = (subject = '') =>
    subject.replace(/^(re|fwd|fw):\s*/gi, '').trim().toLowerCase();

/**
 * Check if email is already processed.
 */
const isAlreadyProcessed = async (messageId) => {
    const { rows } = await query(
        `SELECT id FROM processed_emails WHERE gmail_message_id = $1`,
        [messageId]
    );
    return rows.length > 0;
};

/**
 * Match a reply to an activity.
 *
 * Rules:
 *  1. Sender email matches contact email
 *  2. Activity was sent (not a reply itself)
 *  3. Activity created within last 30 days
 *  4. Subject matches (normalized) OR activity has same contact recently
 */
const findMatchingActivity = async ({ fromEmail, subject, receivedAt }) => {
    const contact = await query(
        `SELECT id, company_id FROM contacts WHERE LOWER(email) = $1 LIMIT 1`,
        [fromEmail]
    );
    if (!contact.rows[0]) return null;

    const contactId = contact.rows[0].id;
    const normalizedSubject = normalizeSubject(subject);

    // Try exact subject match first (last 30 days)
    const { rows: subjectMatches } = await query(
        `SELECT id, subject, response_received FROM activities
     WHERE contact_id = $1
       AND response_received = FALSE
       AND activity_type IN ('Email', 'WhatsApp')
       AND created_at > NOW() - INTERVAL '30 days'
       AND LOWER(TRIM(REGEXP_REPLACE(COALESCE(subject,''), '^(re|fwd|fw):\\s*', '', 'gi'))) = $2
     ORDER BY created_at DESC
     LIMIT 1`,
        [contactId, normalizedSubject]
    );
    if (subjectMatches[0]) return subjectMatches[0];

    // Fallback: most recent activity without reply (last 7 days)
    const { rows: recent } = await query(
        `SELECT id, subject, response_received FROM activities
     WHERE contact_id = $1
       AND response_received = FALSE
       AND activity_type IN ('Email', 'WhatsApp')
       AND created_at > NOW() - INTERVAL '7 days'
       AND created_at < $2
     ORDER BY created_at DESC
     LIMIT 1`,
        [contactId, receivedAt]
    );
    return recent[0] || null;
};

/**
 * Save reply to activity and mark as processed.
 */
const saveReply = async ({ activityId, messageId, receivedAt, body }) => {
    await query(
        `UPDATE activities
     SET response_received = TRUE,
         response_at = $2,
         response_body = $3,
         status = 'Read'::activity_status,
         updated_at = NOW()
     WHERE id = $1 AND response_received = FALSE`,
        [activityId, receivedAt, body.slice(0, 5000)]
    );

    await query(
        `INSERT INTO processed_emails (gmail_message_id, activity_id)
     VALUES ($1, $2)
     ON CONFLICT (gmail_message_id) DO NOTHING`,
        [messageId, activityId]
    );

    logger.info(`[gmail] Reply matched: activity=${activityId} from=${messageId}`);
};

/**
 * Main entry: check inbox for replies.
 */
export const checkInboxForReplies = async () => {
    const messages = await fetchRecentMessages(50);
    if (messages.length === 0) return { checked: 0, matched: 0 };

    let matched = 0;

    for (const msg of messages) {
        if (await isAlreadyProcessed(msg.id)) continue;

        try {
            const full = await fetchMessage(msg.id);
            const headers = parseHeaders(full.payload?.headers);
            const fromEmail = extractEmailAddress(headers.from || '');
            const subject = headers.subject || '';
            const receivedAt = new Date(Number(full.internalDate || Date.now()));
            const body = extractBody(full.payload);

            const activity = await findMatchingActivity({ fromEmail, subject, receivedAt });
            if (activity) {
                await saveReply({
                    activityId: activity.id,
                    messageId: msg.id,
                    receivedAt,
                    body: body || '(no body)',
                });
                matched++;
            } else {
                // Still record processed to avoid re-checking
                await query(
                    `INSERT INTO processed_emails (gmail_message_id) VALUES ($1)
           ON CONFLICT DO NOTHING`,
                    [msg.id]
                );
            }
        } catch (err) {
            logger.warn(`[gmail] Failed to process ${msg.id}: ${err.message}`);
        }
    }

    return { checked: messages.length, matched };
};