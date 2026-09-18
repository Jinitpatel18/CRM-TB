import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { AppError } from '../middleware/errorHandler.js';

export const whatsappService = {
    async send({ to, body }) {
        if (!env.whatsapp.enabled) {
            logger.warn(`[whatsapp] DISABLED — would have sent to ${to}`);
            throw new AppError(
                'WhatsApp channel is currently disabled. Contact admin.',
                503,
                'WHATSAPP_DISABLED'
            );
        }
        // Future Twilio code yahan aayega
        throw new AppError('WhatsApp provider not configured', 500, 'PROVIDER_NOT_READY');
    },
};