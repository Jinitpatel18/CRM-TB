import * as svc from '../services/company.service.js';

export const create = async (req, res, next) => {
    try {
        const company = await svc.createCompany(req.body, req.user.id, req.org.id);
        res.locals.entityId = company.id;
        res.status(201).json({ success: true, data: company });
    } catch (e) { next(e); }
};

export const list = async (req, res, next) => {
    try {
        const data = await svc.listCompanies(req.org.id);
        res.json({ success: true, data });
    } catch (e) { next(e); }
};

export const getById = async (req, res, next) => {
    try {
        const data = await svc.getCompanyWithContacts(Number(req.params.id), req.org.id);
        res.json({ success: true, data });
    } catch (e) { next(e); }
};

export const updateStatus = async (req, res, next) => {
    try {
        const data = await svc.updateCompanyStatus(
            Number(req.params.id),
            req.body.status,
            req.org.id
        );
        res.json({ success: true, data });
    } catch (e) { next(e); }
};