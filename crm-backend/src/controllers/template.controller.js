import * as svc from '../services/template.service.js';
export const create = async (req, res, next) => {
    try {
        const t = await svc.createTemplate(req.body);
        res.status(201).json({ success: true, data: t });
    } catch (e) { next(e); }
};