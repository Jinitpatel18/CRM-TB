import { query, withTransaction } from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';
import { logger } from '../utils/logger.js';

// ---------------- Helpers ----------------

const generateSlug = (name) => {
    return name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .slice(0, 90);
};

const generateToken = () => {
    return (
        Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15) +
        Date.now().toString(36)
    );
};

// ---------------- Organization CRUD ----------------

export const createOrganization = async ({ name, email, phone, industry }, userId) =>
    withTransaction(async (client) => {
        // Generate unique slug
        let baseSlug = generateSlug(name);
        let slug = baseSlug;
        let counter = 1;

        while (true) {
            const { rows } = await client.query(
                `SELECT id FROM organizations WHERE slug = $1`,
                [slug]
            );
            if (rows.length === 0) break;
            slug = `${baseSlug}-${counter++}`;
        }

        // Create org
        const { rows: orgRows } = await client.query(
            `INSERT INTO organizations (name, slug, email, phone, industry, owner_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
            [name, slug, email || null, phone || null, industry || null, userId]
        );
        const org = orgRows[0];

        // Add creator as admin
        await client.query(
            `INSERT INTO organization_members (organization_id, user_id, role, status)
       VALUES ($1, $2, 'admin', 'active')`,
            [org.id, userId]
        );

        logger.info(`[org] Created: ${org.name} (${org.slug}) by ${userId}`);

        return {
            ...org,
            user_role: 'admin',
        };
    });

export const listUserOrganizations = async (userId) => {
    const { rows } = await query(
        `SELECT 
       o.id, o.name, o.slug, o.email, o.industry, o.status, o.created_at,
       om.role AS user_role,
       om.status AS member_status,
       (SELECT COUNT(*)::int FROM companies WHERE organization_id = o.id) AS company_count,
       (SELECT COUNT(*)::int FROM organization_members WHERE organization_id = o.id) AS member_count
     FROM organizations o
     JOIN organization_members om ON om.organization_id = o.id
     WHERE om.user_id = $1 AND om.status = 'active'
     ORDER BY o.created_at ASC`,
        [userId]
    );
    return rows;
};

export const getOrganizationById = async (orgId, userId) => {
    const { rows } = await query(
        `SELECT 
       o.*,
       om.role AS user_role,
       om.status AS member_status
     FROM organizations o
     JOIN organization_members om ON om.organization_id = o.id
     WHERE o.id = $1 AND om.user_id = $2 AND om.status = 'active'`,
        [orgId, userId]
    );
    if (!rows[0]) throw new AppError('Organization not found or access denied', 404, 'NOT_FOUND');
    return rows[0];
};

export const updateOrganization = async (orgId, payload) => {
    const { rows } = await query(
        `UPDATE organizations
     SET 
       name = COALESCE($2, name),
       email = COALESCE($3, email),
       phone = COALESCE($4, phone),
       industry = COALESCE($5, industry),
       updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
        [orgId, payload.name, payload.email, payload.phone, payload.industry]
    );
    if (!rows[0]) throw new AppError('Organization not found', 404, 'NOT_FOUND');
    return rows[0];
};

// ---------------- Members ----------------

export const listMembers = async (orgId) => {
    const { rows } = await query(
        `SELECT 
       om.id AS member_id,
       om.role,
       om.status,
       om.joined_at,
       up.id AS user_id,
       up.email,
       up.full_name
     FROM organization_members om
     JOIN user_profiles up ON up.id = om.user_id
     WHERE om.organization_id = $1
     ORDER BY 
       CASE om.role WHEN 'admin' THEN 1 WHEN 'sales' THEN 2 WHEN 'viewer' THEN 3 END,
       om.joined_at ASC`,
        [orgId]
    );
    return rows;
};

export const updateMemberRole = async (orgId, memberId, role, currentUserId) => {
    if (!['admin', 'sales', 'viewer'].includes(role)) {
        throw new AppError('Invalid role', 400, 'INVALID_ROLE');
    }

    // Prevent changing own role
    const { rows: target } = await query(
        `SELECT om.user_id FROM organization_members om WHERE om.id = $1 AND om.organization_id = $2`,
        [memberId, orgId]
    );
    if (!target[0]) throw new AppError('Member not found', 404, 'NOT_FOUND');
    if (target[0].user_id === currentUserId) {
        throw new AppError('Cannot change your own role', 400, 'SELF_ROLE_CHANGE');
    }

    // Prevent removing last admin
    if (role !== 'admin') {
        const { rows: admins } = await query(
            `SELECT COUNT(*)::int AS count FROM organization_members 
       WHERE organization_id = $1 AND role = 'admin' AND id != $2`,
            [orgId, memberId]
        );
        if (admins[0].count === 0) {
            throw new AppError('Cannot remove the last admin', 400, 'LAST_ADMIN');
        }
    }

    const { rows } = await query(
        `UPDATE organization_members SET role = $2 WHERE id = $1
     RETURNING id, role`,
        [memberId, role]
    );
    return rows[0];
};

export const removeMember = async (orgId, memberId, currentUserId) => {
    const { rows: target } = await query(
        `SELECT user_id, role FROM organization_members WHERE id = $1 AND organization_id = $2`,
        [memberId, orgId]
    );
    if (!target[0]) throw new AppError('Member not found', 404, 'NOT_FOUND');
    if (target[0].user_id === currentUserId) {
        throw new AppError('Cannot remove yourself', 400, 'SELF_REMOVE');
    }

    if (target[0].role === 'admin') {
        const { rows: admins } = await query(
            `SELECT COUNT(*)::int AS count FROM organization_members 
       WHERE organization_id = $1 AND role = 'admin' AND id != $2`,
            [orgId, memberId]
        );
        if (admins[0].count === 0) {
            throw new AppError('Cannot remove the last admin', 400, 'LAST_ADMIN');
        }
    }

    await query(`DELETE FROM organization_members WHERE id = $1`, [memberId]);
    return { removed: true };
};

// ---------------- Invitations ----------------

export const createInvitation = async (
    { organizationId, email, role },
    invitedBy,
    queryFn = query
) => {
    if (!email || !email.includes('@')) {
        throw new AppError('Valid email required', 400, 'INVALID_EMAIL');
    }
    if (!['admin', 'sales', 'viewer'].includes(role)) {
        throw new AppError('Invalid role', 400, 'INVALID_ROLE');
    }

    // Check if user is already a member
    const { rows: existing } = await queryFn(
        `SELECT om.id FROM organization_members om
     JOIN user_profiles up ON up.id = om.user_id
     WHERE om.organization_id = $1 AND LOWER(up.email) = LOWER($2)`,
        [organizationId, email]
    );
    if (existing[0]) {
        throw new AppError('User is already a member of this organization', 400, 'ALREADY_MEMBER');
    }

    // Check for pending invitation
    const { rows: pending } = await queryFn(
        `SELECT id FROM invitations 
     WHERE organization_id = $1 AND LOWER(email) = LOWER($2) 
       AND accepted_at IS NULL AND expires_at > NOW()`,
        [organizationId, email]
    );

    // Expire old pending invitation
    if (pending[0]) {
        await queryFn(`DELETE FROM invitations WHERE id = $1`, [pending[0].id]);
    }

    // Generate token + 7-day expiry
    const token = generateToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const { rows } = await queryFn(
        `INSERT INTO invitations (organization_id, email, role, token, invited_by, expires_at)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
        [organizationId, email.toLowerCase(), role, token, invitedBy, expiresAt]
    );

    logger.info(`[org] Invitation created for ${email} to org ${organizationId}`);

    return rows[0];
};

export const listInvitations = async (organizationId) => {
    const { rows } = await query(
        `SELECT 
       i.id, i.email, i.role, i.token, i.expires_at, i.accepted_at, i.created_at,
       up.email AS invited_by_email
     FROM invitations i
     LEFT JOIN user_profiles up ON up.id = i.invited_by
     WHERE i.organization_id = $1
     ORDER BY i.created_at DESC`,
        [organizationId]
    );
    return rows;
};

export const revokeInvitation = async (invitationId, organizationId) => {
    const { rowCount } = await query(
        `DELETE FROM invitations WHERE id = $1 AND organization_id = $2 AND accepted_at IS NULL`,
        [invitationId, organizationId]
    );
    if (rowCount === 0) {
        throw new AppError('Invitation not found or already accepted', 404, 'NOT_FOUND');
    }
    return { revoked: true };
};

export const verifyInvitationToken = async (token) => {
    const { rows } = await query(
        `SELECT 
       i.*,
       o.name AS organization_name,
       o.slug AS organization_slug
     FROM invitations i
     JOIN organizations o ON o.id = i.organization_id
     WHERE i.token = $1 AND i.accepted_at IS NULL AND i.expires_at > NOW()`,
        [token]
    );
    if (!rows[0]) {
        throw new AppError('Invalid or expired invitation', 400, 'INVALID_INVITATION');
    }
    return rows[0];
};

export const acceptInvitation = async (token, userId, userEmail) =>
    withTransaction(async (client) => {
        // Verify invite
        const { rows: invites } = await client.query(
            `SELECT * FROM invitations 
       WHERE token = $1 AND accepted_at IS NULL AND expires_at > NOW()`,
            [token]
        );
        if (!invites[0]) {
            throw new AppError('Invalid or expired invitation', 400, 'INVALID_INVITATION');
        }
        const invite = invites[0];

        // Verify email match
        if (invite.email.toLowerCase() !== userEmail.toLowerCase()) {
            throw new AppError('This invitation is for a different email', 400, 'EMAIL_MISMATCH');
        }

        // Add as member (or update if already exists but was removed)
        await client.query(
            `INSERT INTO organization_members (organization_id, user_id, role, status)
       VALUES ($1, $2, $3, 'active')
       ON CONFLICT (organization_id, user_id) 
       DO UPDATE SET role = EXCLUDED.role, status = 'active'`,
            [invite.organization_id, userId, invite.role]
        );

        // Mark as accepted
        await client.query(
            `UPDATE invitations SET accepted_at = NOW() WHERE id = $1`,
            [invite.id]
        );

        logger.info(`[org] User ${userEmail} joined org ${invite.organization_id}`);

        return {
            organization_id: invite.organization_id,
            role: invite.role,
        };
    });