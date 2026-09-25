import { google } from 'googleapis';
import { env } from '../config/env.js';
import { AppError } from '../middleware/errorHandler.js';
import { withTransaction, query } from '../config/database.js';
import { logger } from '../utils/logger.js';
import {
    getAuthUrl,
    exchangeCodeForTokens,
    getConnectedAccount,
    isConnected,
    disconnect,
    getAuthenticatedClient,
} from './googleAuth.service.js';

export { getAuthUrl, exchangeCodeForTokens, getConnectedAccount, isConnected, disconnect };

const calendarClient = async () => {
    const auth = await getAuthenticatedClient();
    return google.calendar({ version: 'v3', auth });
};

export const getAvailability = async ({ from, to }) => {
    if (!(await isConnected())) return [];
    const cal = await calendarClient();
    const res = await cal.freebusy.query({
        requestBody: {
            timeMin: new Date(from).toISOString(),
            timeMax: new Date(to).toISOString(),
            items: [{ id: 'primary' }],
        },
    });
    return res.data.calendars.primary.busy || [];
};

export const scheduleMeeting = async (payload, userId, orgId) =>
    withTransaction(async (client) => {
        // Ownership check
        const ownerCheck = await client.query(
            `SELECT id FROM companies WHERE id = $1 AND organization_id = $2`,
            [payload.company_id, orgId]
        );
        if (!ownerCheck.rows[0]) throw new AppError('Company not found', 404, 'NOT_FOUND');

        // Get contacts (org-scoped)
        const contacts = (
            await client.query(
                `SELECT c.*, cp.email_optin FROM contacts c
         LEFT JOIN contact_preferences cp ON cp.contact_id = c.id
         WHERE c.id = ANY($1::int[]) AND c.organization_id = $2`,
                [payload.contact_ids, orgId]
            )
        ).rows;
        if (!contacts.length) throw new AppError('No valid contacts', 400, 'NO_ATTENDEES');

        // Create activity
        const activity = (
            await client.query(
                `INSERT INTO activities
           (company_id, contact_id, activity_type, subject, body, status, 
            sent_by, scheduled_for, sent_at, organization_id)
         VALUES ($1, $2, 'Meeting'::activity_type, $3, $4, 'Sent'::activity_status, 
                 $5, $6, NOW(), $7)
         RETURNING *`,
                [
                    payload.company_id,
                    contacts[0].id,
                    payload.title,
                    payload.description || '',
                    userId,
                    payload.start_time,
                    orgId,
                ]
            )
        ).rows[0];

        // Google Calendar event
        let googleEventId = null;
        let meetingLink = payload.meeting_link || null;
        let calendarStatus = 'simulated';

        if (await isConnected()) {
            try {
                const cal = await calendarClient();
                const attendees = contacts.filter((c) => c.email).map((c) => ({ email: c.email }));

                const event = await cal.events.insert({
                    calendarId: 'primary',
                    conferenceDataVersion: 1,
                    sendUpdates: 'all',
                    requestBody: {
                        summary: payload.title,
                        description: payload.description || '',
                        location: payload.location,
                        start: { dateTime: new Date(payload.start_time).toISOString() },
                        end: { dateTime: new Date(payload.end_time).toISOString() },
                        attendees,
                        conferenceData: meetingLink
                            ? undefined
                            : { createRequest: { requestId: `crm-${activity.id}-${Date.now()}` } },
                    },
                });

                googleEventId = event.data.id;
                meetingLink = meetingLink || event.data.hangoutLink || null;
                calendarStatus = 'created';
                logger.info(`[calendar] Event created: ${googleEventId}`);
            } catch (err) {
                logger.error(`[calendar] Google event failed: ${err.message}`);
                calendarStatus = 'failed';
            }
        }

        const calendarEvent = (
            await client.query(
                `INSERT INTO calendar_events
           (activity_id, google_event_id, title, description, start_time, end_time,
            location, meeting_link, organizer_id, organization_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
                [
                    activity.id,
                    googleEventId,
                    payload.title,
                    payload.description || null,
                    payload.start_time,
                    payload.end_time,
                    payload.location || null,
                    meetingLink,
                    userId,
                    orgId,
                ]
            )
        ).rows[0];

        for (const c of contacts) {
            await client.query(
                `INSERT INTO calendar_event_attendees (event_id, contact_id, rsvp_status)
         VALUES ($1, $2, 'Pending'::rsvp_status)
         ON CONFLICT (event_id, contact_id) DO NOTHING`,
                [calendarEvent.id, c.id]
            );
        }

        return {
            activity,
            event: calendarEvent,
            attendees: contacts.map((c) => c.id),
            calendarStatus,
        };
    });