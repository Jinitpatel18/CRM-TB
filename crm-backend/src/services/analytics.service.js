import { query } from '../config/database.js';

/**
 * Top-level overview stats
 */
export const getOverview = async () => {
    const { rows } = await query(`
    SELECT
      (SELECT COUNT(*)::int FROM companies) AS total_companies,
      (SELECT COUNT(*)::int FROM contacts) AS total_contacts,
      (SELECT COUNT(*)::int FROM activities) AS total_activities,
      (SELECT COUNT(*)::int FROM activities 
        WHERE activity_type = 'Email' AND status = 'Sent') AS total_emails_sent,
      (SELECT COUNT(*)::int FROM activities 
        WHERE response_received = TRUE) AS total_replies,
      (SELECT COUNT(*)::int FROM calendar_events) AS total_meetings,
      (SELECT COUNT(*)::int FROM activities 
        WHERE created_at > NOW() - INTERVAL '7 days') AS activities_7d,
      (SELECT COUNT(*)::int FROM activities 
        WHERE created_at > NOW() - INTERVAL '30 days') AS activities_30d
  `);
    const r = rows[0];
    const replyRate = r.total_emails_sent > 0
        ? ((r.total_replies / r.total_emails_sent) * 100).toFixed(1)
        : '0.0';
    return { ...r, reply_rate: Number(replyRate) };
};

/**
 * Activity count per day for last N days
 */
export const getActivityTrend = async (days = 30) => {
    const { rows } = await query(
        `SELECT 
       TO_CHAR(d.day, 'YYYY-MM-DD') AS date,
       COUNT(a.id)::int AS count
     FROM GENERATE_SERIES(
       (CURRENT_DATE - ($1::int - 1) * INTERVAL '1 day')::date,
       CURRENT_DATE,
       '1 day'
     ) AS d(day)
     LEFT JOIN activities a 
       ON DATE(a.created_at) = d.day
     GROUP BY d.day
     ORDER BY d.day ASC`,
        [days]
    );
    return rows;
};

/**
 * Breakdown by activity type
 */
export const getByType = async () => {
    const { rows } = await query(`
    SELECT activity_type AS type, COUNT(*)::int AS count
    FROM activities
    GROUP BY activity_type
    ORDER BY count DESC
  `);
    return rows;
};

/**
 * Top companies by activity count
 */
export const getTopCompanies = async (limit = 5) => {
    const { rows } = await query(
        `SELECT 
       c.id, c.name,
       COUNT(a.id)::int AS activity_count,
       COUNT(a.id) FILTER (WHERE a.response_received = TRUE)::int AS reply_count
     FROM companies c
     LEFT JOIN activities a ON a.company_id = c.id
     GROUP BY c.id, c.name
     HAVING COUNT(a.id) > 0
     ORDER BY activity_count DESC
     LIMIT $1`,
        [limit]
    );
    return rows;
};

/**
 * Team performance — activities per user
 */
export const getTeamPerformance = async () => {
    const { rows } = await query(`
    SELECT 
       up.id,
       up.email,
       up.full_name,
       up.role,
       COUNT(a.id)::int AS total_sent,
       COUNT(a.id) FILTER (WHERE a.activity_type = 'Email')::int AS emails,
       COUNT(a.id) FILTER (WHERE a.activity_type = 'Meeting')::int AS meetings,
       COUNT(a.id) FILTER (WHERE a.response_received = TRUE)::int AS replies
     FROM user_profiles up
     LEFT JOIN activities a ON a.sent_by = up.id
     GROUP BY up.id, up.email, up.full_name, up.role
     ORDER BY total_sent DESC
  `);
    return rows;
};

/**
 * Activity by hour of day (heatmap)
 */
export const getHourlyActivity = async () => {
    const { rows } = await query(`
    SELECT 
       EXTRACT(HOUR FROM created_at)::int AS hour,
       COUNT(*)::int AS count
    FROM activities
    WHERE created_at > NOW() - INTERVAL '30 days'
    GROUP BY hour
    ORDER BY hour ASC
  `);

    // Fill missing hours with 0
    const hourly = Array.from({ length: 24 }, (_, i) => ({
        hour: i,
        count: rows.find((r) => r.hour === i)?.count || 0,
    }));
    return hourly;
};

/**
 * Recent activity breakdown by status
 */
export const getStatusBreakdown = async () => {
    const { rows } = await query(`
    SELECT status, COUNT(*)::int AS count
    FROM activities
    GROUP BY status
    ORDER BY count DESC
  `);
    return rows;
};