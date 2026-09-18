import * as svc from '../services/analytics.service.js';

export const overview = async (req, res, next) => {
    try {
        const data = await svc.getOverview();
        res.json({ success: true, data });
    } catch (e) { next(e); }
};

export const trend = async (req, res, next) => {
    try {
        const days = Math.min(Number(req.query.days) || 30, 90);
        const data = await svc.getActivityTrend(days);
        res.json({ success: true, data });
    } catch (e) { next(e); }
};

export const byType = async (req, res, next) => {
    try {
        const data = await svc.getByType();
        res.json({ success: true, data });
    } catch (e) { next(e); }
};

export const topCompanies = async (req, res, next) => {
    try {
        const limit = Math.min(Number(req.query.limit) || 5, 20);
        const data = await svc.getTopCompanies(limit);
        res.json({ success: true, data });
    } catch (e) { next(e); }
};

export const teamPerformance = async (req, res, next) => {
    try {
        const data = await svc.getTeamPerformance();
        res.json({ success: true, data });
    } catch (e) { next(e); }
};

export const hourly = async (req, res, next) => {
    try {
        const data = await svc.getHourlyActivity();
        res.json({ success: true, data });
    } catch (e) { next(e); }
};

export const statusBreakdown = async (req, res, next) => {
    try {
        const data = await svc.getStatusBreakdown();
        res.json({ success: true, data });
    } catch (e) { next(e); }
};