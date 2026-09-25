import { query } from '../config/database.js';
import { AppError } from './errorHandler.js';

/**
 * Extracts active organization from request.
 * Priority:
 *  1. X-Org-Id header (if provided)
 *  2. Default: user's first organization membership
 * 
 * Attaches: req.org = { id, name, role, slug }
 * 
 * Must be called AFTER requireAuth (which sets req.user)
 */
export const requireOrg = async (req, res, next) => {
    try {
        if (!req.user?.id) {
            throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
        }

        // Check header first
        const headerOrgId = req.headers['x-org-id'];
        let orgId = headerOrgId ? Number(headerOrgId) : null;

        // If no header, get user's first org
        if (!orgId) {
            const { rows } = await query(
                `SELECT organization_id AS id 
         FROM organization_members 
         WHERE user_id = $1 AND status = 'active'
         ORDER BY joined_at ASC
         LIMIT 1`,
                [req.user.id]
            );
            if (!rows[0]) {
                throw new AppError(
                    'You are not a member of any organization. Please create or join one.',
                    403,
                    'NO_ORG_MEMBERSHIP'
                );
            }
            orgId = rows[0].id;
        }

        // Verify membership + get role
        const { rows: members } = await query(
            `SELECT 
         om.role, om.status,
         o.id, o.name, o.slug, o.email, o.industry, o.status AS org_status
       FROM organization_members om
       JOIN organizations o ON o.id = om.organization_id
       WHERE om.organization_id = $1 AND om.user_id = $2`,
            [orgId, req.user.id]
        );

        if (!members[0]) {
            throw new AppError('Access denied to this organization', 403, 'FORBIDDEN');
        }

        const m = members[0];
        if (m.status !== 'active') {
            throw new AppError('Your membership is inactive', 403, 'INACTIVE_MEMBER');
        }
        if (m.org_status !== 'active') {
            throw new AppError('Organization is not active', 403, 'ORG_INACTIVE');
        }

        req.org = {
            id: m.id,
            name: m.name,
            slug: m.slug,
            email: m.email,
            industry: m.industry,
            role: m.role,
        };

        next();
    } catch (e) {
        next(e);
    }
};

/**
 * Require specific role in the active organization.
 * Usage: requireOrgRole('admin') or requireOrgRole('admin', 'sales')
 */
export const requireOrgRole = (...allowedRoles) => (req, res, next) => {
    if (!req.org) {
        return next(new AppError('Organization context required', 500, 'NO_ORG_CONTEXT'));
    }
    if (!allowedRoles.includes(req.org.role)) {
        return next(
            new AppError(
                `Access denied. Requires one of: ${allowedRoles.join(', ')}`,
                403,
                'FORBIDDEN'
            )
        );
    }
    next();
};