import Bull from 'bull';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

export const emailQueue = new Bull('email', env.redisUrl, {
    limiter: { max: 50, duration: 1000 }, // 50/sec
    defaultJobOptions: {
        attempts: 5,
        backoff: { type: 'exponential', delay: 1000 },
        removeOnComplete: 1000,
        removeOnFail: 5000,
    },
});

export const whatsappQueue = new Bull('whatsapp', env.redisUrl, {
    limiter: { max: 10, duration: 1000 }, // 10/sec
    defaultJobOptions: {
        attempts: 5,
        backoff: { type: 'exponential', delay: 1000 },
        removeOnComplete: 1000,
        removeOnFail: 5000,
    },
});

export const enqueueMessage = async ({ activityId, type, scheduledFor }) => {
    const queue =
        type === 'WhatsApp' ? whatsappQueue : type === 'Email' ? emailQueue : null;
    if (!queue) throw new Error(`Unsupported queue type: ${type}`);

    const opts = scheduledFor
        ? { delay: Math.max(0, new Date(scheduledFor).getTime() - Date.now()) }
        : {};

    const job = await queue.add({ activityId }, opts);
    logger.info(`[queue:${type}] enqueued activity=${activityId} job=${job.id}`);
    return job;
};