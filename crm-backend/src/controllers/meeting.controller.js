import * as svc from '../services/calendar.service.js';

export const schedule = async (req, res, next) => {
    try {
        const data = await svc.scheduleMeeting(req.body, req.user.id, req.org.id);
        res.status(201).json({ success: true, data });
    } catch (e) { next(e); }
};

export const availability = async (req, res, next) => {
    try {
        const busy = await svc.getAvailability({ from: req.query.from, to: req.query.to });
        res.json({ success: true, data: { busy } });
    } catch (e) { next(e); }
};

export const oauthUrl = async (req, res, next) => {
    try {
        res.json({ success: true, data: { url: svc.getAuthUrl() } });
    } catch (e) { next(e); }
};

export const oauthCallback = async (req, res, next) => {
    try {
        const { code, error } = req.query;
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

        if (error) {
            return res.redirect(`${frontendUrl}/settings?google=error&reason=${error}`);
        }
        if (!code) throw new Error('Missing code');

        const result = await svc.exchangeCodeForTokens(code);
        res.redirect(`${frontendUrl}/settings?google=connected&email=${result.email}`);
    } catch (e) {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        console.error('[oauth callback]', e.message);
        res.redirect(`${frontendUrl}/settings?google=error&reason=${encodeURIComponent(e.message)}`);
    }
};

export const oauthStatus = async (req, res, next) => {
    try {
        const account = await svc.getConnectedAccount();
        res.json({
            success: true,
            data: {
                connected: !!account,
                email: account?.email || null,
                expiresAt: account?.expires_at || null,
            },
        });
    } catch (e) { next(e); }
};

export const oauthDisconnect = async (req, res, next) => {
    try {
        await svc.disconnect();
        res.json({ success: true, data: { disconnected: true } });
    } catch (e) { next(e); }
};