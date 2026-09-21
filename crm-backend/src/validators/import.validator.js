import { z } from 'zod';

export const importConfirmSchema = z.object({
    company_id: z.coerce.number().int().positive().optional().nullable(),   // ← optional now
    skip_duplicates: z.boolean().optional().default(true),
    contacts: z.array(
        z.object({
            name: z.string().min(1),
            email: z.string().email().optional().nullable(),
            phone: z.string().optional().nullable(),
            role: z.string().optional().nullable(),
            company: z.string().optional().nullable(),   // ← added
        })
    ).min(1),
});