import { query, withTransaction } from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';

export const createCompany = async (payload, userId, orgId) => {
    if (!orgId) throw new AppError('Organization required', 400, 'NO_ORG');

    const { rows } = await query(
        `INSERT INTO companies (name, email, phone, industry, status, created_by, updated_by, organization_id)
     VALUES ($1, $2, $3, $4, COALESCE($5::company_status, 'Prospect'::company_status), $6, $6, $7)
     RETURNING *`,
        [
            payload.name,
            payload.email,
            payload.phone,
            payload.industry,
            payload.status || null,
            userId,
            orgId,
        ]
    );
    return rows[0];
};

export const listCompanies = async (orgId) => {
    const { rows } = await query(
        `SELECT c.id, c.name, c.industry, c.status, c.email, c.created_at,
            c.created_by, c.organization_id,
            u.email AS created_by_email,
            (SELECT COUNT(*) FROM contacts WHERE company_id = c.id)::int AS contact_count
     FROM companies c
     LEFT JOIN auth.users u ON u.id = c.created_by
     WHERE c.organization_id = $1
     ORDER BY c.created_at DESC`,
        [orgId]
    );
    return rows;
};

export const getCompanyWithContacts = async (id, orgId) => {
    const companyRes = await query(
        `SELECT c.*, u.email AS created_by_email, u2.email AS updated_by_email
     FROM companies c
     LEFT JOIN auth.users u ON u.id = c.created_by
     LEFT JOIN auth.users u2 ON u2.id = c.updated_by
     WHERE c.id = $1 AND c.organization_id = $2`,
        [id, orgId]
    );
    if (!companyRes.rows[0]) throw new AppError('Company not found', 404, 'NOT_FOUND');

    const contacts = await query(
        `SELECT c.*, 
            cp.email_optin, cp.whatsapp_optin, cp.call_optin, cp.do_not_contact,
            u.email AS created_by_email
     FROM contacts c
     LEFT JOIN contact_preferences cp ON cp.contact_id = c.id
     LEFT JOIN auth.users u ON u.id = c.created_by
     WHERE c.company_id = $1 
     ORDER BY c.id`,
        [id]
    );

    return { ...companyRes.rows[0], contacts: contacts.rows };
};

export const updateCompanyStatus = async (id, status, orgId) => {
    const { rows } = await query(
        `UPDATE companies 
     SET status = $2::company_status, updated_at = NOW()
     WHERE id = $1 AND organization_id = $3
     RETURNING id, name, status, updated_at`,
        [id, status, orgId]
    );
    if (!rows[0]) throw new AppError('Company not found', 404, 'NOT_FOUND');
    return rows[0];
};