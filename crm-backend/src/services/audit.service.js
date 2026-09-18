import { query } from '../config/database.js';

export const listAuditLogs = async ({
    userId,
    action,
    entityType,
    from,
    to,
    limit = 100,
    offset = 0,
} = {}) => {
    const conditions = [];
    const params = [];
    let idx = 1;

    if (userId) {
        conditions.push(`a.actor_id = $${idx++}`);
        params.push(userId);
    }
    if (action) {
        conditions.push(`a.action = $${idx++}`);
        params.push(action);
    }
    if (entityType) {
        conditions.push(`a.entity_type = $${idx++}`);
        params.push(entityType);
    }
    if (from) {
        conditions.push(`a.created_at >= $${idx++}`);
        params.push(from);
    }
    if (to) {
        conditions.push(`a.created_at <= $${idx++}`);
        params.push(to);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    params.push(limit, offset);
    const limitIdx = idx++;
    const offsetIdx = idx++;

    const { rows } = await query(
        `SELECT 
       a.id, a.action, a.entity_type, a.entity_id, a.metadata, a.ip_address,
       a.created_at, a.actor_id,
       COALESCE(a.user_email, up.email) AS user_email,
       up.full_name AS user_name,
       up.role AS user_role
     FROM audit_logs a
     LEFT JOIN user_profiles up ON up.id = a.actor_id
     ${where}
     ORDER BY a.created_at DESC
     LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
        params
    );

    return rows;
};

export const getAuditStats = async () => {
    const { rows } = await query(
        `SELECT 
       COUNT(*)::int AS total,
       COUNT(DISTINCT COALESCE(user_email, actor_id::text))::int AS active_users,
       COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours')::int AS last_24h,
       COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days')::int AS last_7d
     FROM audit_logs`
    );
    return rows[0];
};