import { z } from 'zod';

export const sendMessageSchema = z.object({
    company_id: z.number().int().positive(),
    contact_id: z.number().int().positive(),
    template_id: z.number().int().positive().optional(),
    activity_type: z.enum(['Email', 'WhatsApp', 'SMS']),
    subject: z.string().optional(),
    body: z.string().optional(),
    variables: z.record(z.string()).optional(),
    scheduled_for: z.string().datetime().optional(),
    attachment_ids: z.array(z.number().int()).optional(),
    sent_by: z.number().int().optional(),
    attachment_ids: z.array(z.coerce.number().int()).optional(),
});

export const bulkSendSchema = z.object({
    template_id: z.number().int().positive(),
    activity_type: z.enum(['Email', 'WhatsApp', 'SMS']),
    contact_ids: z.array(z.number().int().positive()).min(1),
    scheduled_for: z.string().datetime().optional(),
    variables: z.record(z.string()).optional(),
    sent_by: z.number().int().optional(),
    attachment_ids: z.array(z.coerce.number().int()).optional(),
});