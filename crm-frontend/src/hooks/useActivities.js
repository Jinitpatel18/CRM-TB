import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import toast from 'react-hot-toast';
import { useOrg } from '../lib/OrgContext';   // ← top me add

export const useCompanyActivities = (companyId) => {
    const { activeOrgId } = useOrg();
    return useQuery({
        queryKey: ['activities', String(companyId), activeOrgId],   // ← orgId in key
        queryFn: () => api.companyActivities(companyId),
        enabled: !!companyId && !!activeOrgId,
    });
};

export const useSendMessage = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: api.sendMessage,
        onSuccess: (_, vars) =>
            qc.invalidateQueries({ queryKey: ['activities', String(vars.company_id)] }),
    });
};

export const useBulkSend = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: api.bulkSend,
        onSuccess: (data) => {
            // Success hone par company ke activities refresh karo
            qc.invalidateQueries({ queryKey: ['activities'] });
        },
        onError: (error) => {
            // Error aane par bhi user ko batao
            console.error('Bulk send failed:', error.message);
            toast.error(error.message || 'Bulk send failed. Please try again.');
        },
        onSettled: () => {
            // Success ho ya error, dono case me query ko invalidate karo
            qc.invalidateQueries({ queryKey: ['activities'] });
        },
    });
};