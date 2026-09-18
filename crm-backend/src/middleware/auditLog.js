import { query } from '../config/database.js';
import { logger } from '../utils/logger.js';

export const audit = (action, entityType) => async (req, res, next) => {
    res.on('finish', async () => {
        if (res.statusCode >= 400) return;
        try {
            await query(
                `INSERT INTO audit_logs 
           (actor_id, user_email, action, entity_type, entity_id, metadata, ip_address)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [
                    req.user?.id || null,
                    req.user?.email || null,
                    action,
                    entityType,
                    req.params.id || res.locals.entityId || null,
                    JSON.stringify({ body: req.body, query: req.query }),
                    req.ip,
                ]
            );
        } catch (e) {
            logger.warn('audit log failed: ' + e.message);
        }
    });
    next();
};