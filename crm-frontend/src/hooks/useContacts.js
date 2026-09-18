import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export const useCreateContact = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: api.createContact,
        onSuccess: (_, vars) =>
            qc.invalidateQueries({ queryKey: ['company', String(vars.company_id)] }),
    });
};

export const useUpdateContact = (companyId) => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, ...body }) => api.updateContact(id, body),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['company', String(companyId)] });
        },
    });
};