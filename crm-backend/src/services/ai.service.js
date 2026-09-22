import { GoogleGenAI } from '@google/genai';
import { env } from '../config/env.js';
import { AppError } from '../middleware/errorHandler.js';
import { logger } from '../utils/logger.js';

const genAI = env.gemini?.apiKey
    ? new GoogleGenAI({ apiKey: env.gemini.apiKey })
    : null;

// Fallback models — priority order
const FALLBACK_MODELS = [
    'gemini-flash-latest',
    'gemini-2.0-flash-001',
    'gemini-2.0-flash-lite',
    'gemini-2.5-flash-lite',
    'gemini-2.5-flash',
    'gemini-3.8-flash',
];

const parseJSON = (text, fallback = null) => {
    let cleaned = String(text || '')
        .replace(/```json\s*/gi, '')
        .replace(/```\s*/g, '')
        .trim();

    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) cleaned = match[0];

    try {
        return JSON.parse(cleaned);
    } catch (err) {
        logger.warn(`[ai] JSON parse failed: ${err.message}`);
        return fallback;
    }
};

const ensureConfigured = () => {
    if (!genAI) {
        throw new AppError(
            'AI not configured. Add GEMINI_API_KEY to .env',
            400,
            'AI_NOT_CONFIGURED'
        );
    }
};

/**
 * Call Gemini with retry + fallback models.
 * Handles 503 (server overloaded) gracefully.
 */
const callGemini = async (prompt) => {
    ensureConfigured();

    const MAX_RETRIES = 2;
    let lastError = null;

    for (const modelName of FALLBACK_MODELS) {
        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            try {
                logger.info(`[ai] Trying ${modelName} (attempt ${attempt})`);

                const result = await genAI.models.generateContent({
                    model: modelName,
                    contents: prompt,
                });

                logger.info(`[ai] ✅ Success with ${modelName}`);
                return result.text;
            } catch (err) {
                const errorMsg = err.message || String(err);
                lastError = err;

                if (errorMsg.includes('503') || errorMsg.includes('UNAVAILABLE')) {
                    logger.warn(`[ai] ${modelName} overloaded (attempt ${attempt})`);

                    if (attempt < MAX_RETRIES) {
                        await new Promise((r) => setTimeout(r, 1000 * attempt));
                        continue;
                    }
                } else {
                    logger.warn(`[ai] ${modelName} failed: ${errorMsg.slice(0, 150)}`);
                    break; // try next model
                }
            }
        }
    }

    logger.error(`[ai] All models failed. Last error: ${lastError?.message}`);
    throw new AppError(
        'AI service is temporarily unavailable. Please try again in a minute.',
        503,
        'AI_UNAVAILABLE'
    );
};

export const generateTemplate = async ({ prompt, type = 'Email', tone = 'professional' }) => {
    const systemPrompt = `You are an expert B2B sales copywriter. Generate a ${type} template based on the user's request.

RULES:
1. Use these variables where appropriate: {{ContactName}}, {{ContactRole}}, {{CompanyName}}, {{CompanyEmail}}, {{ContactEmail}}, {{ContactPhone}}
2. Tone: ${tone}
3. Keep it concise and actionable
4. If type is Email, include a subject line
5. Do NOT include any explanation or markdown — return ONLY valid JSON

Return this exact JSON schema:
{
  "name": "Short template name (max 40 chars)",
  "subject": "Email subject (only for Email type, null otherwise)",
  "body": "Full email body with {{variables}} and \\n line breaks",
  "applicable_roles": ["CEO", "CTO", "Manager"]
}

User request: "${prompt}"`;

    try {
        const response = await callGemini(systemPrompt);
        const parsed = parseJSON(response);
        if (!parsed || !parsed.body) throw new Error('Invalid AI response');

        return {
            name: parsed.name || 'AI Generated Template',
            subject: parsed.subject || null,
            body: parsed.body,
            applicable_roles: parsed.applicable_roles || [],
        };
    } catch (err) {
        if (err instanceof AppError) throw err;
        logger.error(`[ai] generateTemplate failed: ${err.message}`);
        throw new AppError(`AI generation failed: ${err.message}`, 500, 'AI_FAILED');
    }
};

export const improveEmail = async ({ subject, body, instruction = 'Make it more professional and concise' }) => {
    const systemPrompt = `You are an expert B2B sales editor. Improve the email below based on the instruction.

CRITICAL RULES:
1. PRESERVE all {{variables}} exactly — do NOT remove or modify them.
2. Keep the core meaning and intent
3. Instruction: ${instruction}
4. Return ONLY valid JSON — no markdown, no explanation

Return this exact JSON schema:
{
  "subject": "Improved subject or same if unchanged",
  "body": "Improved body with {{variables}} preserved",
  "improvements": ["List", "of", "what", "was improved"]
}

Original subject: ${subject || '(none)'}
Original body:
${body}`;

    try {
        const response = await callGemini(systemPrompt);
        const parsed = parseJSON(response);
        if (!parsed || !parsed.body) throw new Error('Invalid AI response');

        return {
            subject: parsed.subject || subject,
            body: parsed.body,
            improvements: parsed.improvements || [],
        };
    } catch (err) {
        if (err instanceof AppError) throw err;
        logger.error(`[ai] improveEmail failed: ${err.message}`);
        throw new AppError(`AI improvement failed: ${err.message}`, 500, 'AI_FAILED');
    }
};

export const analyzeCompany = async ({ company, contacts, activities }) => {
    const activitySummary = activities
        .slice(0, 20)
        .map((a) => {
            const when = a.sent_at || a.created_at || '';
            const reply = a.response_received
                ? ` [REPLIED: ${(a.response_body || '').slice(0, 100)}]`
                : '';
            return `- ${a.activity_type} | "${a.subject || '(no subject)'}" | ${a.status} | ${when}${reply}`;
        })
        .join('\n');

    const contactsList = contacts
        .map((c) => `- ${c.name} (${c.role || 'role unknown'}) — ${c.email || c.phone || 'no contact'}`)
        .join('\n');

    const systemPrompt = `You are a senior B2B sales strategist. Analyze this customer and provide insights.

COMPANY:
- Name: ${company.name}
- Industry: ${company.industry || 'unknown'}
- Status: ${company.status}
- Email: ${company.email || 'unknown'}

CONTACTS (${contacts.length}):
${contactsList || '(none)'}

RECENT ACTIVITIES (${activities.length}):
${activitySummary || '(no activities yet)'}

Return ONLY valid JSON (no markdown) with this schema:
{
  "summary": "2-3 sentence summary of customer relationship",
  "engagement_level": "High | Medium | Low | Dormant",
  "sentiment": "Positive | Neutral | Negative | Unknown",
  "key_insights": ["3-5 specific observations from the data"],
  "suggested_next_action": {
    "action": "Short action title",
    "reasoning": "Why this action",
    "urgency": "High | Medium | Low"
  },
  "draft_email": {
    "subject": "Suggested subject line",
    "body": "A ready-to-send email draft (use {{ContactName}}, {{CompanyName}} placeholders)"
  }
}`;

    try {
        const response = await callGemini(systemPrompt);
        const parsed = parseJSON(response);
        if (!parsed || !parsed.summary) throw new Error('Invalid AI response');

        return parsed;
    } catch (err) {
        if (err instanceof AppError) throw err;
        logger.error(`[ai] analyzeCompany failed: ${err.message}`);
        throw new AppError(`AI analysis failed: ${err.message}`, 500, 'AI_FAILED');
    }
};

export const isConfigured = () => !!genAI;