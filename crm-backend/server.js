import app from './src/app.js';
import { env } from './src/config/env.js';
import { logger } from './src/utils/logger.js';
import { emailService } from './src/services/email.service.js';
import { isConnected as isGoogleConnected } from './src/services/googleAuth.service.js';
import { startReplyTracker } from './src/workers/replyTracker.worker.js';
import './src/workers/messageWorker.js';

const start = async () => {
    await emailService.verify();

    // Start reply tracker only if Google is connected
    const googleConnected = await isGoogleConnected();
    if (googleConnected) {
        await startReplyTracker();
    } else {
        logger.warn('[replyTracker] Skipped — Google account not connected');
    }

    app.listen(env.port, () => logger.info(`🚀 CRM API on :${env.port}`));
};

start();