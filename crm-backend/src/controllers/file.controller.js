import * as svc from '../services/file.service.js';
import { AppError } from '../middleware/errorHandler.js';

export const upload = async (req, res, next) => {
    try {
        if (!req.file) throw new AppError('No file provided', 400, 'NO_FILE');

        const activityId = req.body.activity_id ? Number(req.body.activity_id) : null;

        const file = await svc.uploadFile({
            activityId,
            buffer: req.file.buffer,
            fileName: req.file.originalname,
            mimeType: req.file.mimetype,
            userId: req.user.id,
        });

        res.status(201).json({ success: true, data: file });
    } catch (e) { next(e); }
};

export const listByActivity = async (req, res, next) => {
    try {
        const data = await svc.getActivityFiles(Number(req.params.activityId));
        res.json({ success: true, data });
    } catch (e) { next(e); }
};

export const remove = async (req, res, next) => {
    try {
        const data = await svc.deleteFile(Number(req.params.id));
        res.json({ success: true, data });
    } catch (e) { next(e); }
};