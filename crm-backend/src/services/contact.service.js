import { query, withTransaction } from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';

const assertCompanyOwnership = async (client, companyId, orgId) => {
    const r = await client.query(
        `SELECT id FROM companies WHERE id = $1 AND organization_id = $2`,
        [companyId, orgId]
    );
    if (!r.rows[0]) throw new AppError('Company not found or not yours', 404, 'NOT_FOUND');
};

export const createContact = async (payload, userId, orgId) =>
    withTransaction(async (client) => {
        await assertCompanyOwnership(client, payload.company_id, orgId);

        if (payload.is_primary_contact) {
            await client.query(
                `UPDATE contacts SET is_primary_contact = FALSE WHERE company_id = $1`,
                [payload.company_id]
            );
        }

        const { rows } = await client.query(
            `INSERT INTO contacts 
         (company_id, name, email, phone, role, status, is_primary_contact, 
          created_by, updated_by, organization_id)
       VALUES ($1, $2, $3, $4, $5, 
               COALESCE($6::contact_status, 'Active'::contact_status), 
               COALESCE($7, false), $8, $8, $9)
       RETURNING *`,
            [
                payload.company_id,
                payload.name,
                payload.email,
                payload.phone,
                payload.role,
                payload.status || null,
                payload.is_primary_contact,
                userId,
                orgId,
            ]
        );
        const contact = rows[0];

        await client.query(`INSERT INTO contact_preferences (contact_id) VALUES ($1)`, [contact.id]);

        if (contact.is_primary_contact) {
            await client.query(`UPDATE companies SET primary_contact_id = $1 WHERE id = $2`, [
                contact.id,
                payload.company_id,
            ]);
        }
        return contact;
    });

export const getContactById = async (id, orgId) => {
    const { rows } = await query(
        `SELECT c.*, cp.email_optin, cp.whatsapp_optin, cp.call_optin, cp.do_not_contact
     FROM contacts c
     LEFT JOIN contact_preferences cp ON cp.contact_id = c.id
     WHERE c.id = $1 AND c.organization_id = $2`,
        [id, orgId]
    );
    return rows[0];
};

export const updateContact = async (id, payload, userId, orgId) =>
    withTransaction(async (client) => {
        const existing = await client.query(
            `SELECT * FROM contacts WHERE id = $1 AND organization_id = $2`,
            [id, orgId]
        );
        if (!existing.rows[0]) throw new AppError('Contact not found', 404, 'NOT_FOUND');

        if (payload.is_primary_contact) {
            await client.query(
                `UPDATE contacts SET is_primary_contact = FALSE WHERE company_id = $1 AND id != $2`,
                [existing.rows[0].company_id, id]
            );
        }

        const { rows } = await client.query(
            `UPDATE contacts SET
         name = COALESCE($2, name),
         email = COALESCE($3, email),
         phone = COALESCE($4, phone),
         role = COALESCE($5, role),
         status = COALESCE($6::contact_status, status),
         is_primary_contact = COALESCE($7, is_primary_contact),
         updated_by = $8,
         updated_at = NOW()
       WHERE id = $1 RETURNING *`,
            [
                id,
                payload.name,
                payload.email,
                payload.phone,
                payload.role,
                payload.status,
                payload.is_primary_contact,
                userId,
            ]
        );

        if (
            payload.email_optin !== undefined ||
            payload.whatsapp_optin !== undefined ||
            payload.call_optin !== undefined ||
            payload.do_not_contact !== undefined
        ) {
            await client.query(
                `UPDATE contact_preferences SET
           email_optin = COALESCE($2, email_optin),
           whatsapp_optin = COALESCE($3, whatsapp_optin),
           call_optin = COALESCE($4, call_optin),
           do_not_contact = COALESCE($5, do_not_contact),
           updated_at = NOW()
         WHERE contact_id = $1`,
                [id, payload.email_optin, payload.whatsapp_optin, payload.call_optin, payload.do_not_contact]
            );
        }

        if (payload.is_primary_contact) {
            await client.query(`UPDATE companies SET primary_contact_id = $1 WHERE id = $2`, [
                id,
                existing.rows[0].company_id,
            ]);
        }

        return rows[0];
    });