import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

export const useAuditLogs = (filters = {}) =>
    useQuery({
        queryKey: ['audit-logs', filters],
        queryFn: () => api.listAuditLogs(filters),
        keepPreviousData: true,
    });

export const useAuditStats = () =>
    useQuery({
        queryKey: ['audit-stats'],
        queryFn: api.auditStats,
    });