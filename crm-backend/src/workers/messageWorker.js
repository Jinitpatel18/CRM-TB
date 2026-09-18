import { emailQueue, whatsappQueue } from '../services/queue.service.js';
import { emailService } from '../services/email.service.js';
import { whatsappService } from '../services/whatsapp.service.js';
import { query, withTransaction } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { processReplySync } from './replyTracker.worker.js';

const loadActivity = async (activityId) => {
    const { rows } = await query(
        `SELECT a.*, c.email AS contact_email, c.phone AS contact_phone,
            co.name AS company_name
     FROM activities a
     JOIN contacts c ON c.id = a.contact_id
     JOIN companies co ON co.id = a.company_id
     WHERE a.id = $1`,
        [activityId]
    );
    const activity = rows[0];
    if (!activity) return null;

    // Load attachments
    const { rows: files } = await query(
        `SELECT file_name, file_url, file_type FROM activity_files WHERE activity_id = $1`,
        [activityId]
    );
    activity.attachments = files;

    return activity;
};

const markStatus = (activityId, status, errorMessage = null) =>
    withTransaction(async (client) => {
        await client.query(
            `UPDATE activities 
       SET status = $2::activity_status, 
           sent_at = NOW(), 
           updated_at = NOW(),
           retry_count = retry_count + CASE WHEN $2 = 'Failed' THEN 1 ELSE 0 END
       WHERE id = $1`,
            [activityId, status]
        );
        await client.query(
            `UPDATE message_queue_jobs 
       SET status = $2::queue_job_status, 
           error_message = $3, 
           updated_at = NOW()
       WHERE activity_id = $1`,
            [activityId, status === 'Sent' ? 'Completed' : 'Failed', errorMessage]
        );
    });

emailQueue.process(async (job) => {
    const activity = await loadActivity(job.data.activityId);
    if (!activity) throw new Error('Activity not found');
    try {
        await emailService.send({
            to: activity.contact_email,
            subject: activity.subject,
            body: activity.body,
            attachments: activity.attachments || [],
        });
        await markStatus(activity.id, 'Sent');
    } catch (err) {
        await markStatus(activity.id, 'Failed', err.message);
        throw err; // Bull will retry with exponential backoff
    }
});

whatsappQueue.process(async (job) => {
    const activity = await loadActivity(job.data.activityId);
    if (!activity) throw new Error('Activity not found');
    try {
        await whatsappService.send({ to: activity.contact_phone, body: activity.body });
        await markStatus(activity.id, 'Sent');
    } catch (err) {
        await markStatus(activity.id, 'Failed', err.message);
        throw err;
    }
});

logger.info('[worker] message worker started');

// graceful shutdown
const shutdown = async () => {
    await emailQueue.close();
    await whatsappQueue.close();
    process.exit(0);
};
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
emailQueue.process('sync-replies', processReplySync);