import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { api } from '../lib/api';

export const useUsers = () =>
    useQuery({
        queryKey: ['users'],
        queryFn: api.listUsers,
    });

export const useUpdateUserRole = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, role }) => api.updateUserRole(id, role),
        onSuccess: () => {
            toast.success('Role updated');
            qc.invalidateQueries({ queryKey: ['users'] });
        },
        onError: (err) => toast.error(err.message),
    });
};

export const useUpdateUserStatus = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, status }) => api.updateUserStatus(id, status),
        onSuccess: () => {
            toast.success('Status updated');
            qc.invalidateQueries({ queryKey: ['users'] });
        },
        onError: (err) => toast.error(err.message),
    });
};