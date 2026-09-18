import { emailQueue, whatsappQueue } from '../services/queue.service.js';
import { query } from '../config/database.js';

export const status = async (req, res, next) => {
    try {
        const [emailCounts, waCounts, dbJobs] = await Promise.all([
            emailQueue.getJobCounts(),
            whatsappQueue.getJobCounts(),
            query(
                `SELECT status, COUNT(*)::int AS count
         FROM message_queue_jobs GROUP BY status`
            ),
        ]);
        res.json({
            success: true,
            data: {
                emailQueue: emailCounts,
                whatsappQueue: waCounts,
                databaseJobs: dbJobs.rows,
            },
        });
    } catch (e) { next(e); }
};