import * as svc from '../services/activity.service.js';
import { bulkSend } from '../services/bulkSend.service.js';
import { enqueueMessage } from '../services/queue.service.js';

export const sendMessage = async (req, res, next) => {
    try {
        const activity = await svc.createActivity(req.body, req.user.id, req.org.id);
        await enqueueMessage({
            activityId: activity.id,
            type: req.body.activity_type,
            scheduledFor: req.body.scheduled_for,
        });
        res.status(201).json({ success: true, data: activity });
    } catch (e) { next(e); }
};

export const bulkSendHandler = async (req, res, next) => {
    try {
        const result = await bulkSend(req.body, req.user.id, req.org.id);
        res.status(202).json({ success: true, data: result });
    } catch (e) { next(e); }
};

export const listByCompany = async (req, res, next) => {
    try {
        const data = await svc.getActivitiesByCompany(Number(req.params.company_id), req.org.id);
        res.json({ success: true, data });
    } catch (e) { next(e); }
};

export const recent = async (req, res, next) => {
    try {
        const limit = Math.min(Number(req.query.limit) || 20, 100);
        const data = await svc.getRecentActivities(req.org.id, limit);
        res.json({ success: true, data });
    } catch (e) { next(e); }
};

export const recordResponse = async (req, res, next) => {
    try {
        const data = await svc.markResponse(Number(req.params.id), req.body.response_body);
        res.json({ success: true, data });
    } catch (e) { next(e); }
};