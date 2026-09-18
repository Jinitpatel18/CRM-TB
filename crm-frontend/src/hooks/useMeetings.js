import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { api } from '../lib/api';

export const useScheduleMeeting = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: api.scheduleMeeting,
        onSuccess: () => {
            toast.success('Meeting scheduled');
            qc.invalidateQueries({ queryKey: ['activities'] });
        },
        onError: (error) => {
            toast.error(error.message || 'Failed to schedule meeting');
        },
        onSettled: () => {
            qc.invalidateQueries({ queryKey: ['activities'] });
        },
    });
};