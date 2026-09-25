import { z } from 'zod';

export const createOrganizationSchema = z.object({
    name: z.string().min(2).max(255),
    email: z.string().email().optional().nullable(),
    phone: z.string().max(20).optional().nullable(),
    industry: z.string().max(100).optional().nullable(),
});

export const updateOrganizationSchema = z.object({
    name: z.string().min(2).max(255).optional(),
    email: z.string().email().optional().nullable(),
    phone: z.string().max(20).optional().nullable(),
    industry: z.string().max(100).optional().nullable(),
});

export const createInvitationSchema = z.object({
    email: z.string().email(),
    role: z.enum(['admin', 'sales', 'viewer']).default('sales'),
});

export const updateMemberRoleSchema = z.object({
    role: z.enum(['admin', 'sales', 'viewer']),
});