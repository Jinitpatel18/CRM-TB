import { withTransaction, query } from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';
import { getTemplateById } from './template.service.js';
import { render } from '../utils/templateRenderer.js';
import { env } from '../config/env.js';

const buildVariables = (company, contact, extra = {}) => ({
    CompanyName: company?.name || '',
    CompanyEmail: company?.email || '',
    ContactName: contact?.name || '',
    ContactRole: contact?.role || '',
    ContactEmail: contact?.email || '',
    ContactPhone: contact?.phone || '',
    ...extra,
});

export const createActivity = async (payload, userId) =>
    withTransaction(async (client) => {
        // 1. Company check
        const company = (
            await client.query(`SELECT * FROM companies WHERE id = $1`, [payload.company_id])
        ).rows[0];
        if (!company) throw new AppError('Company not found', 404, 'NOT_FOUND');

        // 2. WhatsApp enabled check
        if (payload.activity_type === 'WhatsApp' && !env.whatsapp.enabled) {
            throw new AppError(
                'WhatsApp channel is disabled. Please choose Email.',
                400,
                'WHATSAPP_DISABLED'
            );
        }

        // 3. Contact check
        const contact = (
            await client.query(`SELECT * FROM contacts WHERE id = $1`, [payload.contact_id])
        ).rows[0];
        if (!contact) throw new AppError('Contact not found', 404, 'NOT_FOUND');

        // 4. Preferences / DNC check
        const prefs = (
            await client.query(`SELECT * FROM contact_preferences WHERE contact_id = $1`, [contact.id])
        ).rows[0];
        if (prefs?.do_not_contact) {
            throw new AppError('Contact has opted out', 400, 'DO_NOT_CONTACT');
        }

        // 5. Template rendering
        let subject = payload.subject;
        let body = payload.body;
        const templateId = payload.template_id || null;

        if (templateId) {
            const tpl = await getTemplateById(templateId);
            if (!tpl) throw new AppError('Template not found', 404, 'NOT_FOUND');
            const vars = buildVariables(company, contact, payload.variables);
            subject = subject || render(tpl.subject || '', vars);
            body = body || render(tpl.body, vars);
        }

        const status = 'Pending';

        // 6. Insert activity
        const { rows } = await client.query(
            `INSERT INTO activities
         (company_id, contact_id, activity_type, template_id, subject, body,
          status, sent_by, scheduled_for)
       VALUES ($1,$2,$3::activity_type,$4,$5,$6,$7::activity_status,$8,$9)
       RETURNING *`,
            [
                payload.company_id,
                payload.contact_id,
                payload.activity_type,
                templateId,
                subject,
                body,
                status,
                userId,
                payload.scheduled_for || null,
            ]
        );
        const activity = rows[0];

        // 7. Link uploaded attachments (agar frontend ne bheje hain)
        if (payload.attachment_ids?.length) {
            // Fetch file rows (already uploaded, activity_id is null)
            const filesRes = await client.query(
                `SELECT id, file_name, file_url, file_type 
     FROM activity_files WHERE id = ANY($1::int[])`,
                [payload.attachment_ids]
            );

            for (const file of filesRes.rows) {
                // Check if this file is already linked to another activity
                const alreadyLinked = await client.query(
                    `SELECT id FROM activity_files WHERE file_url = $1 AND activity_id IS NOT NULL LIMIT 1`,
                    [file.file_url]
                );

                if (alreadyLinked.rows.length > 0) {
                    // File is already used → create a duplicate row for this activity (same storage URL)
                    await client.query(
                        `INSERT INTO activity_files (activity_id, file_name, file_url, file_type)
         VALUES ($1, $2, $3, $4)`,
                        [activity.id, file.file_name, file.file_url, file.file_type]
                    );
                } else {
                    // First use → just link the existing row
                    await client.query(
                        `UPDATE activity_files SET activity_id = $1 WHERE id = $2`,
                        [activity.id, file.id]
                    );
                }
            }
        }

        // 8. Queue job log
        await client.query(
            `INSERT INTO message_queue_jobs (activity_id, job_type, status, scheduled_for)
       VALUES ($1, $2::queue_job_type, 'Queued'::queue_job_status, $3)`,
            [activity.id, payload.scheduled_for ? 'Schedule' : 'Send', payload.scheduled_for || null]
        );

        return activity;
    });

// Company-specific activity history
export const getActivitiesByCompany = async (companyId) => {
    const { rows } = await query(
        `SELECT a.*,
            c.name AS contact_name,
            t.name AS template_name,
            u.email AS sent_by_email,
            up.full_name AS sent_by_name,
            (SELECT COUNT(*) FROM activity_files WHERE activity_id = a.id)::int AS file_count
     FROM activities a
     JOIN contacts c ON c.id = a.contact_id
     LEFT JOIN message_templates t ON t.id = a.template_id
     LEFT JOIN auth.users u ON u.id = a.sent_by
     LEFT JOIN user_profiles up ON up.id = a.sent_by
     WHERE a.company_id = $1
     ORDER BY a.created_at DESC`,
        [companyId]
    );
    return rows;
};

// Live feed ke liye — recent activities across all companies
export const getRecentActivities = async (limit = 20) => {
    const { rows } = await query(
        `SELECT a.id, a.activity_type, a.subject, a.status, a.sent_at,
            a.response_received, a.response_at, a.response_body,
            a.created_at, a.company_id, a.contact_id,
            c.name AS contact_name,
            co.name AS company_name,
            u.email AS sent_by_email,
            up.full_name AS sent_by_name,
            (SELECT COUNT(*) FROM activity_files WHERE activity_id = a.id)::int AS file_count
     FROM activities a
     LEFT JOIN contacts c ON c.id = a.contact_id
     LEFT JOIN companies co ON co.id = a.company_id
     LEFT JOIN auth.users u ON u.id = a.sent_by
     LEFT JOIN user_profiles up ON up.id = a.sent_by
     ORDER BY a.created_at DESC
     LIMIT $1`,
        [limit]
    );
    return rows;
};

export const markResponse = async (activityId, responseBody) => {
    const { rows } = await query(
        `UPDATE activities
     SET response_received = TRUE,
         response_at = NOW(),
         response_body = $2,
         status = 'Read'::activity_status,
         updated_at = NOW()
     WHERE id = $1 RETURNING *`,
        [activityId, responseBody]
    );
    return rows[0];
};