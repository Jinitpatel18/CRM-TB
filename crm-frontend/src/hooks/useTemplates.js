import { useMutation } from '@tanstack/react-query';
import { api } from '../lib/api';
export const useCreateTemplate = () => useMutation({ mutationFn: api.createTemplate });