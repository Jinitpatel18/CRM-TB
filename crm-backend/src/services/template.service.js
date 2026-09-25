import { query } from '../config/database.js';
import { extractVariables } from '../utils/templateRenderer.js';

export const createTemplate = async (payload, userId, orgId) => {
    const vars = payload.variables ?? {};
    const detected = extractVariables(`${payload.subject || ''} ${payload.body}`);
    detected.forEach((k) => {
        if (!(k in vars)) vars[k] = '';
    });

    const { rows } = await query(
        `INSERT INTO message_templates
       (name, type, subject, body, applicable_roles, variables, is_customizable, created_by, organization_id)
     VALUES ($1, $2::template_type, $3, $4, $5, $6, COALESCE($7, true), $8, $9)
     RETURNING *`,
        [
            payload.name,
            payload.type,
            payload.subject || null,
            payload.body,
            payload.applicable_roles || null,
            JSON.stringify(vars),
            payload.is_customizable,
            userId,
            orgId,
        ]
    );
    return rows[0];
};

export const getTemplateById = async (id, orgId) => {
    const { rows } = await query(
        `SELECT * FROM message_templates WHERE id = $1 AND organization_id = $2`,
        [id, orgId]
    );
    return rows[0];
};

export const listTemplates = async (orgId) => {
    const { rows } = await query(
        `SELECT id, name, type, subject, applicable_roles, created_at
     FROM message_templates
     WHERE organization_id = $1
     ORDER BY created_at DESC`,
        [orgId]
    );
    return rows;
};