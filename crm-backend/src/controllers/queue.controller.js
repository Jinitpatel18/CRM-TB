import { query } from '../config/database.js';

export const status = async (req, res, next) => {
    try {
        const orgId = req.org.id;

        // DB jobs — org-scoped (join with activities)
        const dbJobs = await query(
            `SELECT mqj.status, COUNT(*)::int AS count
       FROM message_queue_jobs mqj
       JOIN activities a ON a.id = mqj.activity_id
       WHERE a.organization_id = $1
       GROUP BY mqj.status`,
            [orgId]
        );

        // Email stats — org-scoped (from activities table)
        const emailStats = await query(
            `SELECT status, COUNT(*)::int AS count
       FROM activities
       WHERE organization_id = $1 AND activity_type = 'Email'
       GROUP BY status`,
            [orgId]
        );

        // WhatsApp stats — org-scoped
        const waStats = await query(
            `SELECT status, COUNT(*)::int AS count
       FROM activities
       WHERE organization_id = $1 AND activity_type = 'WhatsApp'
       GROUP BY status`,
            [orgId]
        );

        // Build emailQueue object (like Bull format for compatibility)
        const emailQueue = {
            waiting: 0,
            active: 0,
            completed: 0,
            failed: 0,
            delayed: 0,
            paused: 0,
        };
        emailStats.rows.forEach((r) => {
            const key = r.status.toLowerCase();
            if (key in emailQueue) emailQueue[key] = r.count;
            // Map "sent" → "completed", "pending" → "waiting"
            if (r.status === 'Sent') emailQueue.completed = r.count;
            if (r.status === 'Pending') emailQueue.waiting = r.count;
            if (r.status === 'Failed') emailQueue.failed = r.count;
        });

        const whatsappQueue = {
            waiting: 0,
            active: 0,
            completed: 0,
            failed: 0,
            delayed: 0,
            paused: 0,
        };
        waStats.rows.forEach((r) => {
            if (r.status === 'Sent') whatsappQueue.completed = r.count;
            if (r.status === 'Pending') whatsappQueue.waiting = r.count;
            if (r.status === 'Failed') whatsappQueue.failed = r.count;
        });

        // Build databaseJobs array (Bull-style)
        const databaseJobs = {};
        dbJobs.rows.forEach((r) => {
            databaseJobs[r.status.toLowerCase()] = r.count;
        });

        res.json({
            success: true,
            data: {
                emailQueue,
                whatsappQueue,
                databaseJobs: Object.entries(databaseJobs).map(([status, count]) => ({
                    status: status.charAt(0).toUpperCase() + status.slice(1),
                    count,
                })),
            },
        });
    } catch (e) {
        next(e);
    }
};