import * as svc from '../services/analytics.service.js';

export const overview = async (req, res, next) => {
    try { res.json({ success: true, data: await svc.getOverview(req.org.id) }); }
    catch (e) { next(e); }
};

export const trend = async (req, res, next) => {
    try {
        const days = Math.min(Number(req.query.days) || 30, 90);
        res.json({ success: true, data: await svc.getActivityTrend(req.org.id, days) });
    } catch (e) { next(e); }
};

export const byType = async (req, res, next) => {
    try { res.json({ success: true, data: await svc.getByType(req.org.id) }); }
    catch (e) { next(e); }
};

export const topCompanies = async (req, res, next) => {
    try {
        const limit = Math.min(Number(req.query.limit) || 5, 20);
        res.json({ success: true, data: await svc.getTopCompanies(req.org.id, limit) });
    } catch (e) { next(e); }
};

export const teamPerformance = async (req, res, next) => {
    try { res.json({ success: true, data: await svc.getTeamPerformance(req.org.id) }); }
    catch (e) { next(e); }
};

export const hourly = async (req, res, next) => {
    try { res.json({ success: true, data: await svc.getHourlyActivity(req.org.id) }); }
    catch (e) { next(e); }
};

export const statusBreakdown = async (req, res, next) => {
    try { res.json({ success: true, data: await svc.getStatusBreakdown(req.org.id) }); }
    catch (e) { next(e); }
};