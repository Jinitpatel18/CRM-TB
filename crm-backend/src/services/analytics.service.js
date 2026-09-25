import { query } from '../config/database.js';

export const getOverview = async (orgId) => {
  const { rows } = await query(
    `SELECT
      (SELECT COUNT(*)::int FROM companies WHERE organization_id = $1) AS total_companies,
      (SELECT COUNT(*)::int FROM contacts WHERE organization_id = $1) AS total_contacts,
      (SELECT COUNT(*)::int FROM activities WHERE organization_id = $1) AS total_activities,
      (SELECT COUNT(*)::int FROM activities 
        WHERE organization_id = $1 AND activity_type = 'Email' AND status = 'Sent') AS total_emails_sent,
      (SELECT COUNT(*)::int FROM activities 
        WHERE organization_id = $1 AND response_received = TRUE) AS total_replies,
      (SELECT COUNT(*)::int FROM calendar_events WHERE organization_id = $1) AS total_meetings,
      (SELECT COUNT(*)::int FROM activities 
        WHERE organization_id = $1 AND created_at > NOW() - INTERVAL '7 days') AS activities_7d,
      (SELECT COUNT(*)::int FROM activities 
        WHERE organization_id = $1 AND created_at > NOW() - INTERVAL '30 days') AS activities_30d`,
    [orgId]
  );
  const r = rows[0];
  const replyRate = r.total_emails_sent > 0
    ? ((r.total_replies / r.total_emails_sent) * 100).toFixed(1)
    : '0.0';
  return { ...r, reply_rate: Number(replyRate) };
};

export const getActivityTrend = async (orgId, days = 30) => {
  const { rows } = await query(
    `SELECT 
       TO_CHAR(d.day, 'YYYY-MM-DD') AS date,
       COUNT(a.id)::int AS count
     FROM GENERATE_SERIES(
       (CURRENT_DATE - ($2::int - 1) * INTERVAL '1 day')::date,
       CURRENT_DATE,
       '1 day'
     ) AS d(day)
     LEFT JOIN activities a 
       ON DATE(a.created_at) = d.day AND a.organization_id = $1
     GROUP BY d.day
     ORDER BY d.day ASC`,
    [orgId, days]
  );
  return rows;
};

export const getByType = async (orgId) => {
  const { rows } = await query(
    `SELECT activity_type AS type, COUNT(*)::int AS count
     FROM activities
     WHERE organization_id = $1
     GROUP BY activity_type
     ORDER BY count DESC`,
    [orgId]
  );
  return rows;
};

export const getTopCompanies = async (orgId, limit = 5) => {
  const { rows } = await query(
    `SELECT 
       c.id, c.name,
       COUNT(a.id)::int AS activity_count,
       COUNT(a.id) FILTER (WHERE a.response_received = TRUE)::int AS reply_count
     FROM companies c
     LEFT JOIN activities a ON a.company_id = c.id
     WHERE c.organization_id = $1
     GROUP BY c.id, c.name
     HAVING COUNT(a.id) > 0
     ORDER BY activity_count DESC
     LIMIT $2`,
    [orgId, limit]
  );
  return rows;
};

export const getTeamPerformance = async (orgId) => {
  const { rows } = await query(
    `SELECT 
       up.id,
       up.email,
       up.full_name,
       om.role,
       COUNT(a.id)::int AS total_sent,
       COUNT(a.id) FILTER (WHERE a.activity_type = 'Email')::int AS emails,
       COUNT(a.id) FILTER (WHERE a.activity_type = 'Meeting')::int AS meetings,
       COUNT(a.id) FILTER (WHERE a.response_received = TRUE)::int AS replies
     FROM organization_members om
     JOIN user_profiles up ON up.id = om.user_id
     LEFT JOIN activities a ON a.sent_by = up.id AND a.organization_id = $1
     WHERE om.organization_id = $1 AND om.status = 'active'
     GROUP BY up.id, up.email, up.full_name, om.role
     ORDER BY total_sent DESC`,
    [orgId]
  );
  return rows;
};

export const getHourlyActivity = async (orgId) => {
  const { rows } = await query(
    `SELECT 
       EXTRACT(HOUR FROM created_at)::int AS hour,
       COUNT(*)::int AS count
    FROM activities
    WHERE organization_id = $1 AND created_at > NOW() - INTERVAL '30 days'
    GROUP BY hour
    ORDER BY hour ASC`,
    [orgId]
  );
  const hourly = Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    count: rows.find((r) => r.hour === i)?.count || 0,
  }));
  return hourly;
};

export const getStatusBreakdown = async (orgId) => {
  const { rows } = await query(
    `SELECT status, COUNT(*)::int AS count
     FROM activities
     WHERE organization_id = $1
     GROUP BY status
     ORDER BY count DESC`,
    [orgId]
  );
  return rows;
};