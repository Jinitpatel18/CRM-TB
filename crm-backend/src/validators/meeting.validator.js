import { z } from 'zod';

export const scheduleMeetingSchema = z.object({
    company_id: z.coerce.number().int().positive(),
    title: z.string().min(1).max(255),
    description: z.string().optional().nullable().or(z.literal('')),
    start_time: z.string().datetime(),
    end_time: z.string().datetime(),
    location: z.string().optional().nullable().or(z.literal('')),
    meeting_link: z.string().url().optional().nullable().or(z.literal('')),
    organizer_id: z.coerce.number().int().optional().nullable(),
    contact_ids: z.array(z.coerce.number().int().positive()).min(1),
});

export const availabilityQuerySchema = z.object({
    contact_ids: z.string().transform((s) => s.split(',').map(Number)),
    from: z.string().datetime(),
    to: z.string().datetime(),
    duration_minutes: z.string().transform(Number).default('30'),
});