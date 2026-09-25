import * as svc from '../services/template.service.js';

export const create = async (req, res, next) => {
    try {
        const t = await svc.createTemplate(req.body, req.user.id, req.org.id);
        res.status(201).json({ success: true, data: t });
    } catch (e) { next(e); }
};

export const list = async (req, res, next) => {
    try {
        const data = await svc.listTemplates(req.org.id);
        res.json({ success: true, data });
    } catch (e) { next(e); }
};