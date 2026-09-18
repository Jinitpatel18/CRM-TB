import * as svc from '../services/company.service.js';

export const create = async (req, res, next) => {
    try {
        const company = await svc.createCompany(req.body, req.user.id);
        res.locals.entityId = company.id;
        res.status(201).json({ success: true, data: company });
    } catch (e) { next(e); }
};

export const list = async (req, res, next) => {
    try {
        const data = await svc.listCompanies();
        res.json({ success: true, data });
    } catch (e) { next(e); }
};

export const getById = async (req, res, next) => {
    try {
        const data = await svc.getCompanyWithContacts(Number(req.params.id));
        res.json({ success: true, data });
    } catch (e) { next(e); }
};

// ⬇️ YE MISSING HAI
export const updateStatus = async (req, res, next) => {
    try {
        const data = await svc.updateCompanyStatus(
            Number(req.params.id),
            req.body.status
        );
        res.json({ success: true, data });
    } catch (e) { next(e); }
};