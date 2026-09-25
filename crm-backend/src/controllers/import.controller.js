import * as svc from '../services/import.service.js';
import { query, withTransaction } from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';
import { logger } from '../utils/logger.js';

export const preview = async (req, res, next) => {
    try {
        if (!req.file) throw new AppError('No file uploaded', 400, 'NO_FILE');

        const columnMapping = req.body.column_mapping
            ? JSON.parse(req.body.column_mapping)
            : null;

        const companyIdRaw = req.body.company_id;
        const isMulti =
            !companyIdRaw || companyIdRaw === 'null' || companyIdRaw === '';
        const companyId = isMulti ? null : Number(companyIdRaw);

        if (!isMulti) {
            const check = await query(
                `SELECT id FROM companies WHERE id = $1 AND organization_id = $2`,
                [companyId, req.org.id]
            );
            if (!check.rows[0]) throw new AppError('Company not found', 404, 'NOT_FOUND');
        }

        const result = await svc.parseImportFileWithMapping({
            buffer: req.file.buffer,
            fileName: req.file.originalname,
            mimeType: req.file.mimetype,
            columnMapping,
        });

        if (isMulti) {
            const multiResult = await svc.markMultiDuplicates(result.contacts, req.org.id, query);
            return res.json({
                success: true,
                data: {
                    mode: 'multi',
                    source: result.source,
                    total: result.total,
                    valid_count: result.valid_count,
                    invalid_count: result.invalid_count,
                    contacts: multiResult.contacts.map((c, i) => ({ ...c, _tempId: i })),
                    companies: multiResult.companies,
                    invalid: result.invalid,
                },
            });
        }

        const withDups = await svc.markDuplicates(result.contacts, companyId, req.org.id, query);
        res.json({
            success: true,
            data: {
                mode: 'single',
                ...result,
                contacts: withDups,
            },
        });
    } catch (e) { next(e); }
};

export const detectColumns = async (req, res, next) => {
    try {
        if (!req.file) throw new AppError('No file uploaded', 400, 'NO_FILE');

        const result = await svc.parseImportFileWithMapping({
            buffer: req.file.buffer,
            fileName: req.file.originalname,
            mimeType: req.file.mimetype,
            columnMapping: null,
        });

        res.json({ success: true, data: result });
    } catch (e) { next(e); }
};

export const confirm = async (req, res, next) => {
    try {
        const { company_id, contacts, skip_duplicates = true } = req.body;

        if (!Array.isArray(contacts) || contacts.length === 0) {
            throw new AppError('No contacts to import', 400, 'NO_CONTACTS');
        }

        if (!company_id) {
            return confirmMulti(req, res, { contacts, skip_duplicates });
        }

        const check = await query(
            `SELECT id FROM companies WHERE id = $1 AND organization_id = $2`,
            [company_id, req.org.id]
        );
        if (!check.rows[0]) throw new AppError('Company not found', 404, 'NOT_FOUND');

        const inserted = [];
        const skipped = [];

        await withTransaction(async (client) => {
            for (const c of contacts) {
                if (skip_duplicates) {
                    const { rows: dup } = await client.query(
                        `SELECT id FROM contacts 
             WHERE company_id = $1 
               AND ((email IS NOT NULL AND LOWER(email) = LOWER($2)) 
                    OR (phone IS NOT NULL AND phone = $3))`,
                        [company_id, c.email || null, c.phone || null]
                    );
                    if (dup.length > 0) {
                        skipped.push({ ...c, reason: 'duplicate' });
                        continue;
                    }
                }

                const { rows } = await client.query(
                    `INSERT INTO contacts 
             (company_id, name, email, phone, role, created_by, updated_by, organization_id)
           VALUES ($1, $2, $3, $4, $5, $6, $6, $7)
           RETURNING *`,
                    [company_id, c.name, c.email || null, c.phone || null, c.role || null, req.user.id, req.org.id]
                );
                const contact = rows[0];

                await client.query(
                    `INSERT INTO contact_preferences (contact_id) VALUES ($1)`,
                    [contact.id]
                );

                inserted.push(contact);
            }
        });

        logger.info(`[import] single-mode: ${inserted.length} imported, ${skipped.length} skipped`);

        res.status(201).json({
            success: true,
            data: {
                mode: 'single',
                imported: inserted.length,
                skipped: skipped.length,
                contacts: inserted,
            },
        });
    } catch (e) { next(e); }
};

async function confirmMulti(req, res, { contacts, skip_duplicates }) {
    const inserted = [];
    const skipped = [];
    const createdCompanies = [];
    const mergedCompanies = [];
    const orgId = req.org.id;

    const grouped = {};
    for (const c of contacts) {
        const name = (c.company || '').trim();
        if (!name) {
            skipped.push({ ...c, reason: 'missing_company' });
            continue;
        }
        const key = name.toLowerCase();
        if (!grouped[key]) grouped[key] = { name, contacts: [] };
        grouped[key].contacts.push(c);
    }

    if (Object.keys(grouped).length === 0) {
        throw new AppError(
            'No valid company names in CSV. Add a "Company" column.',
            400,
            'NO_COMPANY_COLUMN'
        );
    }

    await withTransaction(async (client) => {
        for (const { name: companyName, contacts: companyContacts } of Object.values(grouped)) {
            let companyId;
            const { rows: existing } = await client.query(
                `SELECT id FROM companies 
         WHERE LOWER(TRIM(name)) = LOWER(TRIM($1)) AND organization_id = $2`,
                [companyName, orgId]
            );

            if (existing[0]) {
                companyId = existing[0].id;
                mergedCompanies.push({ name: companyName, id: companyId });

                const explicitCompanyEmail = companyContacts.find((c) => c.company_email)?.company_email || null;
                const firstContactEmail = companyContacts.find((c) => c.email)?.email || null;
                const emailToSet = explicitCompanyEmail || firstContactEmail;

                if (emailToSet) {
                    await client.query(
                        `UPDATE companies 
             SET email = COALESCE(email, $1), updated_at = NOW()
             WHERE id = $2 AND (email IS NULL OR email = '')`,
                        [emailToSet, companyId]
                    );
                }
            } else {
                const explicitCompanyEmail = companyContacts.find((c) => c.company_email)?.company_email || null;
                const firstContactEmail = companyContacts.find((c) => c.email)?.email || null;
                const companyEmail = explicitCompanyEmail || firstContactEmail;

                const { rows: created } = await client.query(
                    `INSERT INTO companies (name, email, status, created_by, updated_by, organization_id)
           VALUES ($1, $2, 'Prospect'::company_status, $3, $3, $4)
           RETURNING id, name`,
                    [companyName, companyEmail, req.user.id, orgId]
                );
                companyId = created[0].id;
                createdCompanies.push({ name: companyName, id: companyId, email: companyEmail });
            }

            for (const c of companyContacts) {
                if (skip_duplicates) {
                    const { rows: dup } = await client.query(
                        `SELECT id FROM contacts 
             WHERE company_id = $1 
               AND ((email IS NOT NULL AND LOWER(email) = LOWER($2)) 
                    OR (phone IS NOT NULL AND phone = $3))`,
                        [companyId, c.email || null, c.phone || null]
                    );
                    if (dup.length > 0) {
                        skipped.push({ ...c, company: companyName, reason: 'duplicate' });
                        continue;
                    }
                }

                const { rows } = await client.query(
                    `INSERT INTO contacts 
             (company_id, name, email, phone, role, created_by, updated_by, organization_id)
           VALUES ($1, $2, $3, $4, $5, $6, $6, $7)
           RETURNING *`,
                    [companyId, c.name, c.email || null, c.phone || null, c.role || null, req.user.id, orgId]
                );
                const contact = rows[0];

                await client.query(
                    `INSERT INTO contact_preferences (contact_id) VALUES ($1)`,
                    [contact.id]
                );

                inserted.push({ ...contact, _company: companyName });
            }
        }
    });

    logger.info(
        `[import-multi] ${createdCompanies.length} companies created, ${mergedCompanies.length} merged, ${inserted.length} contacts imported`
    );

    res.status(201).json({
        success: true,
        data: {
            mode: 'multi',
            imported: inserted.length,
            skipped: skipped.length,
            companies_created: createdCompanies.length,
            companies_merged: mergedCompanies.length,
            created_companies: createdCompanies,
            merged_companies: mergedCompanies,
            contacts: inserted,
        },
    });
}