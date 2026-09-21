import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../config/env.js';
import { AppError } from '../middleware/errorHandler.js';
import { logger } from '../utils/logger.js';

const genAI = env.gemini?.apiKey
    ? new GoogleGenerativeAI(env.gemini.apiKey)
    : null;

const MODEL = 'gemini-1.5-flash';

const getModel = () => {
    if (!genAI) {
        throw new AppError(
            'AI not configured. Add GEMINI_API_KEY to .env',
            400,
            'AI_NOT_CONFIGURED'
        );
    }
    return genAI.getGenerativeModel({ model: MODEL });
};

/**
 * Extract JSON from AI response (handles markdown fences, extra text)
 */
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

/**
 * FEATURE 1: Generate email template from prompt
 */
export const generateTemplate = async ({ prompt, type = 'Email', tone = 'professional' }) => {
    const model = getModel();

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
        const result = await model.generateContent(systemPrompt);
        const response = result.response.text();

        const parsed = parseJSON(response);
        if (!parsed || !parsed.body) {
            throw new Error('Invalid AI response');
        }

        return {
            name: parsed.name || 'AI Generated Template',
            subject: parsed.subject || null,
            body: parsed.body,
            applicable_roles: parsed.applicable_roles || [],
        };
    } catch (err) {
        logger.error(`[ai] generateTemplate failed: ${err.message}`);
        throw new AppError(`AI generation failed: ${err.message}`, 500, 'AI_FAILED');
    }
};

/**
 * FEATURE 2: Improve existing email draft
 */
export const improveEmail = async ({ subject, body, instruction = 'Make it more professional and concise' }) => {
    const model = getModel();

    const systemPrompt = `You are an expert B2B sales editor. Improve the email below based on the instruction.

CRITICAL RULES:
1. PRESERVE all {{variables}} exactly — do NOT remove or modify them: {{ContactName}}, {{CompanyName}}, etc.
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
        const result = await model.generateContent(systemPrompt);
        const response = result.response.text();

        const parsed = parseJSON(response);
        if (!parsed || !parsed.body) {
            throw new Error('Invalid AI response');
        }

        return {
            subject: parsed.subject || subject,
            body: parsed.body,
            improvements: parsed.improvements || [],
        };
    } catch (err) {
        logger.error(`[ai] improveEmail failed: ${err.message}`);
        throw new AppError(`AI improvement failed: ${err.message}`, 500, 'AI_FAILED');
    }
};

/**
 * FEATURE 3: Analyze company activities + suggest next action
 */
export const analyzeCompany = async ({ company, contacts, activities }) => {
    const model = getModel();

    // Build a compact activity summary (last 20)
    const activitySummary = activities
        .slice(0, 20)
        .map((a) => {
            const when = a.sent_at || a.created_at || '';
            const reply = a.response_received ? ` [REPLIED: ${(a.response_body || '').slice(0, 100)}]` : '';
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
        const result = await model.generateContent(systemPrompt);
        const response = result.response.text();

        const parsed = parseJSON(response);
        if (!parsed || !parsed.summary) {
            throw new Error('Invalid AI response');
        }

        return parsed;
    } catch (err) {
        logger.error(`[ai] analyzeCompany failed: ${err.message}`);
        throw new AppError(`AI analysis failed: ${err.message}`, 500, 'AI_FAILED');
    }
};

export const isConfigured = () => !!genAI;