import * as svc from '../services/ai.service.js';
import { query } from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';

/**
 * POST /api/ai/generate-template
 */
export const generateTemplate = async (req, res, next) => {
    try {
        const { prompt, type, tone } = req.body;
        if (!prompt || prompt.trim().length < 5) {
            throw new AppError('Prompt is required (min 5 chars)', 400, 'INVALID_PROMPT');
        }

        const data = await svc.generateTemplate({ prompt, type, tone });
        res.json({ success: true, data });
    } catch (e) {
        next(e);
    }
};

/**
 * POST /api/ai/improve-email
 */
export const improveEmail = async (req, res, next) => {
    try {
        const { subject, body, instruction } = req.body;
        if (!body || body.trim().length < 5) {
            throw new AppError('Body is required', 400, 'INVALID_BODY');
        }

        const data = await svc.improveEmail({ subject, body, instruction });
        res.json({ success: true, data });
    } catch (e) {
        next(e);
    }
};

/**
 * POST /api/ai/analyze-company/:id
 */
export const analyzeCompany = async (req, res, next) => {
    try {
        const companyId = Number(req.params.id);

        // Fetch company
        const { rows: companies } = await query(
            `SELECT id, name, industry, status, email FROM companies WHERE id = $1`,
            [companyId]
        );
        const company = companies[0];
        if (!company) throw new AppError('Company not found', 404, 'NOT_FOUND');

        // Fetch contacts
        const { rows: contacts } = await query(
            `SELECT name, email, phone, role FROM contacts WHERE company_id = $1 ORDER BY id`,
            [companyId]
        );

        // Fetch activities
        const { rows: activities } = await query(
            `SELECT activity_type, subject, status, sent_at, created_at,
              response_received, response_body
       FROM activities
       WHERE company_id = $1
       ORDER BY created_at DESC
       LIMIT 30`,
            [companyId]
        );

        const data = await svc.analyzeCompany({ company, contacts, activities });
        res.json({ success: true, data });
    } catch (e) {
        next(e);
    }
};

/**
 * GET /api/ai/status
 */
export const status = async (req, res) => {
    res.json({
        success: true,
        data: { configured: svc.isConfigured() },
    });
};