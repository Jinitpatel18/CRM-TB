import { emailQueue } from '../services/queue.service.js';
import { checkInboxForReplies } from '../services/gmail.service.js';
import { logger } from '../utils/logger.js';

const JOB_NAME = 'sync-replies';
const INTERVAL_MS = 60_000; // Every 60 seconds

/**
 * Register recurring job.
 */
export const startReplyTracker = async () => {
    // Remove stale repeat jobs
    const existing = await emailQueue.getRepeatableJobs();
    for (const j of existing) {
        if (j.name === JOB_NAME) {
            await emailQueue.removeRepeatableByKey(j.key);
        }
    }

    await emailQueue.add(
        JOB_NAME,
        {},
        {
            repeat: { every: INTERVAL_MS },
            removeOnComplete: true,
            removeOnFail: 50,
            jobId: JOB_NAME,
        }
    );

    logger.info(`[replyTracker] Scheduled every ${INTERVAL_MS / 1000}s`);
};

/**
 * Process handler (registered in messageWorker.js).
 */
export const processReplySync = async (job) => {
    try {
        const result = await checkInboxForReplies();
        if (result.matched > 0) {
            logger.info(`[replyTracker] ✅ ${result.matched} replies matched`);
        }
    } catch (err) {
        logger.warn(`[replyTracker] Sync failed: ${err.message}`);
    }
};