import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { api } from '../lib/api';

// Single company
export const useCompany = (id) =>
    useQuery({
        queryKey: ['company', String(id)],
        queryFn: () => api.getCompany(id),
        enabled: !!id,
    });

// List of companies
export const useCompanies = () =>
    useQuery({
        queryKey: ['companies-list'],
        queryFn: () => api.listCompanies(),
    });

// Create company
export const useCreateCompany = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: api.createCompany,
        onSuccess: () => qc.invalidateQueries({ queryKey: ['companies-list'] }),
    });
};

// Update company status
export const useUpdateCompanyStatus = (companyId = null) => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, status }) => api.updateCompanyStatus(id, status),
        onSuccess: () => {
            toast.success('Status updated');
            qc.invalidateQueries({ queryKey: ['companies-list'] });
            if (companyId) {
                qc.invalidateQueries({ queryKey: ['company', String(companyId)] });
            }
        },
        onError: (err) => toast.error(err.message),
    });
};