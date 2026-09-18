import * as svc from '../services/user.service.js';

export const list = async (req, res, next) => {
    try {
        const data = await svc.listUsers();
        res.json({ success: true, data });
    } catch (e) { next(e); }
};

export const me = async (req, res, next) => {
    try {
        const data = await svc.getUserProfile(req.user.id);
        res.json({ success: true, data });
    } catch (e) { next(e); }
};

export const updateRole = async (req, res, next) => {
    try {
        const data = await svc.updateUserRole(req.params.id, req.body.role);
        res.json({ success: true, data });
    } catch (e) { next(e); }
};

export const updateStatus = async (req, res, next) => {
    try {
        const data = await svc.updateUserStatus(req.params.id, req.body.status);
        res.json({ success: true, data });
    } catch (e) { next(e); }
};