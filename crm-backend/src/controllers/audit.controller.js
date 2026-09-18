import * as svc from '../services/audit.service.js';

export const list = async (req, res, next) => {
    try {
        const data = await svc.listAuditLogs({
            userId: req.query.user_id,
            action: req.query.action,
            entityType: req.query.entity_type,
            from: req.query.from,
            to: req.query.to,
            limit: Math.min(Number(req.query.limit) || 100, 500),
            offset: Number(req.query.offset) || 0,
        });
        res.json({ success: true, data });
    } catch (e) { next(e); }
};

export const stats = async (req, res, next) => {
    try {
        const data = await svc.getAuditStats();
        res.json({ success: true, data });
    } catch (e) { next(e); }
};