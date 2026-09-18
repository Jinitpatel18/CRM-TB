import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

export const useAnalyticsOverview = () =>
    useQuery({
        queryKey: ['analytics-overview'],
        queryFn: api.analyticsOverview,
        refetchInterval: 60000,
    });

export const useAnalyticsTrend = (days = 30) =>
    useQuery({
        queryKey: ['analytics-trend', days],
        queryFn: () => api.analyticsTrend(days),
    });

export const useAnalyticsByType = () =>
    useQuery({
        queryKey: ['analytics-by-type'],
        queryFn: api.analyticsByType,
    });

export const useAnalyticsTopCompanies = (limit = 5) =>
    useQuery({
        queryKey: ['analytics-top-companies', limit],
        queryFn: () => api.analyticsTopCompanies(limit),
    });

export const useAnalyticsTeamPerformance = () =>
    useQuery({
        queryKey: ['analytics-team'],
        queryFn: api.analyticsTeamPerformance,
    });

export const useAnalyticsHourly = () =>
    useQuery({
        queryKey: ['analytics-hourly'],
        queryFn: api.analyticsHourly,
    });