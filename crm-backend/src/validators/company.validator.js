import { z } from 'zod';
export const createCompanySchema = z.object({
    name: z.string().min(1).max(255),
    email: z.string().email().optional(),
    phone: z.string().max(20).optional(),
    industry: z.string().max(100).optional(),
    status: z.enum(['Active', 'Inactive', 'Churned', 'Prospect']).optional(),
});

export const updateCompanyStatusSchema = z.object({
    status: z.enum(['Active', 'Inactive', 'Churned', 'Prospect']),
});
