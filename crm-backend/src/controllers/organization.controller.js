import * as svc from '../services/organization.service.js';

// ---------- Organizations ----------

export const create = async (req, res, next) => {
    try {
        const org = await svc.createOrganization(req.body, req.user.id);
        res.status(201).json({ success: true, data: org });
    } catch (e) { next(e); }
};

export const listMine = async (req, res, next) => {
    try {
        const orgs = await svc.listUserOrganizations(req.user.id);
        res.json({ success: true, data: orgs });
    } catch (e) { next(e); }
};

export const getById = async (req, res, next) => {
    try {
        const org = await svc.getOrganizationById(Number(req.params.id), req.user.id);
        res.json({ success: true, data: org });
    } catch (e) { next(e); }
};

export const update = async (req, res, next) => {
    try {
        const org = await svc.updateOrganization(req.org.id, req.body);
        res.json({ success: true, data: org });
    } catch (e) { next(e); }
};

// ---------- Members ----------

export const listMembers = async (req, res, next) => {
    try {
        const data = await svc.listMembers(req.org.id);
        res.json({ success: true, data });
    } catch (e) { next(e); }
};

export const updateMemberRole = async (req, res, next) => {
    try {
        const data = await svc.updateMemberRole(
            req.org.id,
            Number(req.params.memberId),
            req.body.role,
            req.user.id
        );
        res.json({ success: true, data });
    } catch (e) { next(e); }
};

export const removeMember = async (req, res, next) => {
    try {
        const data = await svc.removeMember(
            req.org.id,
            Number(req.params.memberId),
            req.user.id
        );
        res.json({ success: true, data });
    } catch (e) { next(e); }
};

// ---------- Invitations ----------

export const createInvitation = async (req, res, next) => {
    try {
        const invite = await svc.createInvitation(
            {
                organizationId: req.org.id,
                email: req.body.email,
                role: req.body.role || 'sales',
            },
            req.user.id
        );
        res.status(201).json({ success: true, data: invite });
    } catch (e) { next(e); }
};

export const listInvitations = async (req, res, next) => {
    try {
        const data = await svc.listInvitations(req.org.id);
        res.json({ success: true, data });
    } catch (e) { next(e); }
};

export const revokeInvitation = async (req, res, next) => {
    try {
        const data = await svc.revokeInvitation(
            Number(req.params.id),
            req.org.id
        );
        res.json({ success: true, data });
    } catch (e) { next(e); }
};

/**
 * PUBLIC endpoint — verify invite token
 * No auth required (user may not be logged in yet)
 */
export const verifyInvite = async (req, res, next) => {
    try {
        const data = await svc.verifyInvitationToken(req.params.token);
        // Don't expose invited_by or token
        res.json({
            success: true,
            data: {
                email: data.email,
                role: data.role,
                organization_name: data.organization_name,
                organization_slug: data.organization_slug,
                expires_at: data.expires_at,
            },
        });
    } catch (e) { next(e); }
};

/**
 * Accept invite — requires auth
 */
export const acceptInvite = async (req, res, next) => {
    try {
        const data = await svc.acceptInvitation(
            req.params.token,
            req.user.id,
            req.user.email
        );
        res.json({ success: true, data });
    } catch (e) { next(e); }
};