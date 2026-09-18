import { z } from 'zod';
export const createContactSchema = z.object({
    company_id: z.number().int().positive(),
    name: z.string().min(1).max(255),
    email: z.string().email().optional(),
    phone: z.string().max(20).optional(),
    role: z.string().max(100).optional(),
    is_primary_contact: z.boolean().optional(),
});
export const updateContactSchema = z.object({
    name: z.string().min(1).max(255).optional(),
    email: z.string().email().optional().nullable(),
    phone: z.string().max(20).optional().nullable(),
    role: z.string().max(100).optional().nullable(),
    status: z.enum(['Active', 'Inactive', 'DoNotContact']).optional(),
    is_primary_contact: z.boolean().optional(),
    email_optin: z.boolean().optional(),
    whatsapp_optin: z.boolean().optional(),
    call_optin: z.boolean().optional(),
    do_not_contact: z.boolean().optional(),
});