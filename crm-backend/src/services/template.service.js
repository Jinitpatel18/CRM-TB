import { query } from '../config/database.js';
import { extractVariables } from '../utils/templateRenderer.js';

export const createTemplate = async (payload) => {
    const vars = payload.variables ?? {};
    const detected = extractVariables(`${payload.subject || ''} ${payload.body}`);
    detected.forEach((k) => { if (!(k in vars)) vars[k] = ''; });

    const { rows } = await query(
        `INSERT INTO message_templates
       (name, type, subject, body, applicable_roles, variables, is_customizable, created_by)
     VALUES ($1,$2::template_type,$3,$4,$5,$6,COALESCE($7,true),$8)
     RETURNING *`,
        [
            payload.name,
            payload.type,              // ← ::template_type cast
            payload.subject || null,
            payload.body,
            payload.applicable_roles || null,
            JSON.stringify(vars),
            payload.is_customizable,
            payload.created_by || null,
        ]
    );
    return rows[0];
};

export const getTemplateById = async (id) => {
    const { rows } = await query(`SELECT * FROM message_templates WHERE id=$1`, [id]);
    return rows[0];
};