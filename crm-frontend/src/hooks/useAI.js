import { useMutation, useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { api } from '../lib/api';

export const useAIStatus = () =>
    useQuery({
        queryKey: ['ai-status'],
        queryFn: api.aiStatus,
        staleTime: 5 * 60 * 1000,
    });

export const useGenerateTemplate = () =>
    useMutation({
        mutationFn: api.aiGenerateTemplate,
        onError: (err) => toast.error(err.message || 'AI generation failed'),
    });

export const useImproveEmail = () =>
    useMutation({
        mutationFn: api.aiImproveEmail,
        onError: (err) => toast.error(err.message || 'AI improvement failed'),
    });

export const useAnalyzeCompany = () =>
    useMutation({
        mutationFn: (id) => api.aiAnalyzeCompany(id),
        onError: (err) => toast.error(err.message || 'AI analysis failed'),
    });