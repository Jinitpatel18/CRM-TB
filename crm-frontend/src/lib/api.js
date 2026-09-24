import { supabase } from './supabase';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

async function request(path, { method = 'GET', body, query } = {}) {
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

// ⬇️ Special handler for file uploads (multipart)
async function requestMultipart(path, formData) {
    const { data: { session } } = await supabase.auth.getSession();

    const headers = {};
    if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
    }
    // NOTE: Don't set Content-Type — browser will set it with boundary

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
    // Companies
    createCompany: (body) => request('/companies', { method: 'POST', body }),
    getCompany: (id) => request(`/companies/${id}`),
    listCompanies: () => request('/companies'),
    updateCompanyStatus: (id, status) =>
        request(`/companies/${id}/status`, { method: 'PATCH', body: { status } }),

    // Contacts
    createContact: (body) => request('/contacts', { method: 'POST', body }),
    getContact: (id) => request(`/contacts/${id}`),
    updateContact: (id, body) => request(`/contacts/${id}`, { method: 'PATCH', body }),

    // Templates
    createTemplate: (body) => request('/templates', { method: 'POST', body }),
    //Google oAuth
    oauthStatus: () => request('/calendar/oauth/status'),
    oauthUrl: () => request('/calendar/oauth/url'),
    oauthDisconnect: () => request('/calendar/oauth/disconnect', { method: 'POST' }),

    // Activities
    sendMessage: (body) => request('/activities/send-message', { method: 'POST', body }),
    bulkSend: (body) => request('/activities/bulk-send', { method: 'POST', body }),
    companyActivities: (companyId) => request(`/activities/${companyId}`),
    recentActivities: (limit = 20) => request('/activities/recent', { query: { limit } }),
    recordResponse: (id, body) => request(`/activities/${id}/response`, { method: 'POST', body }),

    // Meetings
    scheduleMeeting: (body) => request('/meetings/schedule', { method: 'POST', body }),
    availability: (query) => request('/calendar/availability', { query }),

    // AI Assistant
    aiStatus: () => request('/ai/status'),
    aiGenerateTemplate: (body) => request('/ai/generate-template', { method: 'POST', body }),
    aiImproveEmail: (body) => request('/ai/improve-email', { method: 'POST', body }),
    aiAnalyzeCompany: (id) => request(`/ai/analyze-company/${id}`, { method: 'POST' }),

    // Multi-company import
    importPreviewMulti: (file) => {
        const formData = new FormData();
        formData.append('file', file);
        return requestMultipart('/import/preview', formData);
    },

    // Queue
    queueStatus: () => request('/queue/status'),

    // Analytics
    analyticsOverview: () => request('/analytics/overview'),
    analyticsTrend: (days = 30) => request('/analytics/trend', { query: { days } }),
    analyticsByType: () => request('/analytics/by-type'),
    analyticsTopCompanies: (limit = 5) => request('/analytics/top-companies', { query: { limit } }),
    analyticsTeamPerformance: () => request('/analytics/team-performance'),
    analyticsHourly: () => request('/analytics/hourly'),
    analyticsStatusBreakdown: () => request('/analytics/status-breakdown'),

    // Users (team)
    listUsers: () => request('/users'),
    me: () => request('/users/me'),
    updateUserRole: (id, role) => request(`/users/${id}/role`, { method: 'PATCH', body: { role } }),
    updateUserStatus: (id, status) => request(`/users/${id}/status`, { method: 'PATCH', body: { status } }),

    // Audit
    listAuditLogs: (query = {}) => request('/audit-logs', { query }),
    auditStats: () => request('/audit-logs/stats'),

    // ⬇️ Import (NEW)
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