import { z } from 'zod';
export const createTemplateSchema = z.object({
    name: z.string().min(1).max(255),
    type: z.enum(['Email', 'WhatsApp', 'SMS']),
    subject: z.string().max(255).optional(),
    body: z.string().min(1),
    applicable_roles: z.array(z.string()).optional(),
    variables: z.record(z.string()).optional(),
    is_customizable: z.boolean().optional(),
    created_by: z.number().int().optional(),
});