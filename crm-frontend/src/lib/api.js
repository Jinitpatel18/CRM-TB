import { supabase } from './supabase';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

const getActiveOrgId = () => {
    try {
        return localStorage.getItem('crm_active_org_id');
    } catch {
        return null;
    }
};

async function request(path, { method = 'GET', body, query, skipOrgHeader = false } = {}) {
    let url = `${BASE}${path}`;
    if (query) {
        const qs = new URLSearchParams(
            Object.entries(query).filter(([, v]) => v !== undefined && v !== null && v !== '')
        ).toString();
        if (qs) url += `?${qs}`;
    }

    const { data: { session } } = await supabase.auth.getSession();

    const headers = { 'Content-Type': 'application/json' };
    if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
    }

    // ⬇️ Add X-Org-Id header (unless explicitly skipped)
    if (!skipOrgHeader) {
        const orgId = getActiveOrgId();
        if (orgId) headers['X-Org-Id'] = orgId;
    }

    const res = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
    });

    let json = null;
    try { json = await res.json(); } catch { /* empty */ }

    if (res.status === 401) {
        await supabase.auth.signOut();
    }

    if (!res.ok || json?.success === false) {
        const msg = json?.error?.message || `Request failed (${res.status})`;
        const err = new Error(msg);
        err.code = json?.error?.code;
        err.status = res.status;
        throw err;
    }
    return json?.data ?? json;
}

async function requestMultipart(path, formData, { skipOrgHeader = false } = {}) {
    const { data: { session } } = await supabase.auth.getSession();

    const headers = {};
    if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
    }

    if (!skipOrgHeader) {
        const orgId = getActiveOrgId();
        if (orgId) headers['X-Org-Id'] = orgId;
    }

    const res = await fetch(`${BASE}${path}`, {
        method: 'POST',
        headers,
        body: formData,
    });

    let json = null;
    try { json = await res.json(); } catch { /* empty */ }

    if (res.status === 401) await supabase.auth.signOut();

    if (!res.ok || json?.success === false) {
        const msg = json?.error?.message || `Request failed (${res.status})`;
        const err = new Error(msg);
        err.code = json?.error?.code;
        err.status = res.status;
        throw err;
    }
    return json?.data ?? json;
}

export const api = {
    // ============================================
    // ORGANIZATIONS (skip org header — they define it)
    // ============================================
    listMyOrganizations: () =>
        request('/organizations/me', { skipOrgHeader: true }),
    createOrganization: (body) =>
        request('/organizations', { method: 'POST', body, skipOrgHeader: true }),
    getOrganizationById: (id) =>
        request(`/organizations/${id}`, { skipOrgHeader: true }),
    getCurrentOrg: () =>
        request('/organizations/current'),
    updateCurrentOrg: (body) =>
        request('/organizations/current', { method: 'PATCH', body }),

    // Organization Members
    listOrgMembers: () =>
        request('/organizations/current/members'),
    updateOrgMemberRole: (memberId, role) =>
        request(`/organizations/current/members/${memberId}`, { method: 'PATCH', body: { role } }),
    removeOrgMember: (memberId) =>
        request(`/organizations/current/members/${memberId}`, { method: 'DELETE' }),

    // Invitations
    listInvitations: () =>
        request('/organizations/current/invitations'),
    createInvitation: (body) =>
        request('/organizations/current/invitations', { method: 'POST', body }),
    revokeInvitation: (id) =>
        request(`/organizations/current/invitations/${id}`, { method: 'DELETE' }),
    verifyInvitation: (token) =>
        request(`/invitations/${token}/verify`, { skipOrgHeader: true }),
    acceptInvitation: (token) =>
        request(`/invitations/${token}/accept`, { method: 'POST', skipOrgHeader: true }),

    // ============================================
    // COMPANIES
    // ============================================
    createCompany: (body) => request('/companies', { method: 'POST', body }),
    getCompany: (id) => request(`/companies/${id}`),
    listCompanies: () => request('/companies'),
    updateCompanyStatus: (id, status) =>
        request(`/companies/${id}/status`, { method: 'PATCH', body: { status } }),

    // ============================================
    // CONTACTS
    // ============================================
    createContact: (body) => request('/contacts', { method: 'POST', body }),
    getContact: (id) => request(`/contacts/${id}`),
    updateContact: (id, body) => request(`/contacts/${id}`, { method: 'PATCH', body }),

    // ============================================
    // TEMPLATES
    // ============================================
    createTemplate: (body) => request('/templates', { method: 'POST', body }),
    listTemplates: () => request('/templates'),

    // ============================================
    // GOOGLE OAUTH
    // ============================================
    oauthStatus: () => request('/calendar/oauth/status'),
    oauthUrl: () => request('/calendar/oauth/url'),
    oauthDisconnect: () => request('/calendar/oauth/disconnect', { method: 'POST' }),

    // ============================================
    // ACTIVITIES
    // ============================================
    sendMessage: (body) => request('/activities/send-message', { method: 'POST', body }),
    bulkSend: (body) => request('/activities/bulk-send', { method: 'POST', body }),
    companyActivities: (companyId) => request(`/activities/${companyId}`),
    recentActivities: (limit = 20) => request('/activities/recent', { query: { limit } }),
    recordResponse: (id, body) => request(`/activities/${id}/response`, { method: 'POST', body }),

    // ============================================
    // MEETINGS
    // ============================================
    scheduleMeeting: (body) => request('/meetings/schedule', { method: 'POST', body }),
    availability: (query) => request('/calendar/availability', { query }),

    // ============================================
    // AI ASSISTANT
    // ============================================
    aiStatus: () => request('/ai/status'),
    aiGenerateTemplate: (body) => request('/ai/generate-template', { method: 'POST', body }),
    aiImproveEmail: (body) => request('/ai/improve-email', { method: 'POST', body }),
    aiAnalyzeCompany: (id) => request(`/ai/analyze-company/${id}`, { method: 'POST' }),

    // ============================================
    // QUEUE
    // ============================================
    queueStatus: () => request('/queue/status'),

    // ============================================
    // ANALYTICS
    // ============================================
    analyticsOverview: () => request('/analytics/overview'),
    analyticsTrend: (days = 30) => request('/analytics/trend', { query: { days } }),
    analyticsByType: () => request('/analytics/by-type'),
    analyticsTopCompanies: (limit = 5) => request('/analytics/top-companies', { query: { limit } }),
    analyticsTeamPerformance: () => request('/analytics/team-performance'),
    analyticsHourly: () => request('/analytics/hourly'),
    analyticsStatusBreakdown: () => request('/analytics/status-breakdown'),

    // ============================================
    // USERS
    // ============================================
    listUsers: () => request('/users'),
    me: () => request('/users/me'),
    updateUserRole: (id, role) => request(`/users/${id}/role`, { method: 'PATCH', body: { role } }),
    updateUserStatus: (id, status) => request(`/users/${id}/status`, { method: 'PATCH', body: { status } }),

    // ============================================
    // AUDIT
    // ============================================
    listAuditLogs: (query = {}) => request('/audit-logs', { query }),
    auditStats: () => request('/audit-logs/stats'),

    // ============================================
    // IMPORT
    // ============================================
    importPreview: (companyId, file, columnMapping) => {
        const formData = new FormData();
        formData.append('file', file);
        if (companyId) formData.append('company_id', String(companyId));
        if (columnMapping) formData.append('column_mapping', JSON.stringify(columnMapping));
        return requestMultipart('/import/preview', formData);
    },
    detectColumns: (file) => {
        const formData = new FormData();
        formData.append('file', file);
        return requestMultipart('/import/detect-columns', formData);
    },
    importConfirm: (companyId, contacts, skipDuplicates = true) =>
        request('/import/confirm', {
            method: 'POST',
            body: {
                company_id: companyId,
                contacts,
                skip_duplicates: skipDuplicates,
            },
        }),
};

export { getActiveOrgId };