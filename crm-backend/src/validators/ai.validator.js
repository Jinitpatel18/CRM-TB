import { z } from 'zod';

export const generateTemplateSchema = z.object({
    prompt: z.string().min(5).max(2000),
    type: z.enum(['Email', 'WhatsApp', 'SMS']).optional().default('Email'),
    tone: z.enum(['professional', 'friendly', 'formal', 'casual', 'persuasive']).optional().default('professional'),
});

export const improveEmailSchema = z.object({
    subject: z.string().optional().nullable(),
    body: z.string().min(5).max(10000),
    instruction: z.string().max(500).optional(),
});