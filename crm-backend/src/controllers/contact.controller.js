import * as svc from '../services/contact.service.js';

export const create = async (req, res, next) => {
    try {
        const c = await svc.createContact(req.body, req.user.id, req.org.id);
        res.locals.entityId = c.id;
        res.status(201).json({ success: true, data: c });
    } catch (e) { next(e); }
};

export const getById = async (req, res, next) => {
    try {
        const c = await svc.getContactById(Number(req.params.id), req.org.id);
        if (!c) return res.status(404).json({ success: false, error: { message: 'Not found' } });
        res.json({ success: true, data: c });
    } catch (e) { next(e); }
};

export const update = async (req, res, next) => {
    try {
        const c = await svc.updateContact(Number(req.params.id), req.body, req.user.id, req.org.id);
        res.json({ success: true, data: c });
    } catch (e) { next(e); }
};