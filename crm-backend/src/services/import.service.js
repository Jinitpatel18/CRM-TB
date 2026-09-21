import { parse as csvParse } from 'csv-parse/sync';
import * as XLSX from 'xlsx';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { AppError } from '../middleware/errorHandler.js';

// ---------------- AI Client ----------------
const genAI = env.gemini?.apiKey
    ? new GoogleGenerativeAI(env.gemini.apiKey)
    : null;

// ---------------- Column Detection ----------------
const COLUMN_PATTERNS = {
    name: [/^name$/i, /full.?name/i, /contact.?name/i, /person/i, /^naam$/i],
    email: [/^email$/i, /e?.?mail/i, /email.?address/i],
    phone: [/phone/i, /mobile/i, /contact.?no/i, /number/i, /whatsapp/i],
    role: [/role/i, /title/i, /designation/i, /position/i, /job/i],
    company: [/^company$/i, /company.?name/i, /organi[sz]ation/i, /firm/i],
    company_email: [/company.?email/i, /^org.*email/i, /business.?email/i],   // ← ADD
};

const detectColumnMapping = (headers) => {
    const mapping = {};
    for (const [field, patterns] of Object.entries(COLUMN_PATTERNS)) {
        for (const header of headers) {
            if (patterns.some((p) => p.test(String(header).trim()))) {
                mapping[field] = header;
                break;
            }
        }
    }
    return mapping;
};

// ---------------- Row Normalization ----------------
const normalizeContact = (row, mapping) => ({
    name: String(row[mapping.name] ?? '').trim() || null,
    email: String(row[mapping.email] ?? '').trim().toLowerCase() || null,
    phone: String(row[mapping.phone] ?? '').trim().replace(/[^\d+\-() ]/g, '') || null,
    role: String(row[mapping.role] ?? '').trim() || null,
    company: String(row[mapping.company] ?? '').trim() || null,
    company_email: String(row[mapping.company_email] ?? '').trim().toLowerCase() || null,   // ← ADD
});

const isValidContact = (c) =>
    c.name && (c.email || c.phone);

// ---------------- CSV Parser ----------------
const parseCSV = (buffer) => {
    const content = buffer.toString('utf-8');
    const rows = csvParse(content, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        bom: true,
        relaxColumnCount: true,
    });
    return rows;
};

// ---------------- Excel Parser ----------------
const parseXLSX = (buffer) => {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    return XLSX.utils.sheet_to_json(firstSheet, { defval: '' });
};

// ---------------- PDF Parser (text-based) ----------------
const parsePDFText = async (buffer) => {
    try {
        const pdfParse = (await import('pdf-parse')).default;
        const data = await pdfParse(buffer);
        return data.text;
    } catch (err) {
        logger.warn(`[import] PDF text extract failed: ${err.message}`);
        return '';
    }
};

// ---------------- AI Extraction (Gemini) ----------------
const aiExtractContacts = async ({ text, mimeType, buffer }) => {
    if (!genAI) {
        throw new AppError(
            'AI extraction not configured. Add GEMINI_API_KEY to .env',
            400,
            'AI_NOT_CONFIGURED'
        );
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `Extract all contacts from the following content. Return ONLY valid JSON array (no markdown, no extra text) with this exact schema:
[
  {
    "name": "Full Name",
    "email": "email@example.com",
    "phone": "+91 9876543210",
    "role": "Job Title",
    "company": "Company Name"
  }
]

Rules:
- name is required; skip entries without a name
- email and phone are optional but at least one should be present
- role and company are optional
- If no contacts found, return []

Content:
${text}`;

    try {
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        // Clean markdown code fences if present
        let cleaned = responseText
            .replace(/```json\s*/gi, '')
            .replace(/```\s*/g, '')
            .trim();

        // Extract JSON array if wrapped in text
        const match = cleaned.match(/\[[\s\S]*\]/);
        if (match) cleaned = match[0];

        const contacts = JSON.parse(cleaned);
        return Array.isArray(contacts) ? contacts : [];
    } catch (err) {
        logger.error(`[import] AI extraction failed: ${err.message}`);
        throw new AppError(`AI extraction failed: ${err.message}`, 500, 'AI_FAILED');
    }
};

// ---------------- Main Parse Entry ----------------
export const parseImportFile = async ({ buffer, fileName, mimeType }) => {
    const lowerName = fileName.toLowerCase();

    let contacts = [];
    let source = 'unknown';
    let columnMapping = null;

    // Detect file type
    const isCSV = lowerName.endsWith('.csv') || mimeType === 'text/csv';
    const isXLSX =
        lowerName.endsWith('.xlsx') ||
        lowerName.endsWith('.xls') ||
        mimeType?.includes('spreadsheet') ||
        mimeType?.includes('excel');
    const isPDF = lowerName.endsWith('.pdf') || mimeType === 'application/pdf';

    if (isCSV) {
        source = 'csv';
        const rows = parseCSV(buffer);
        if (rows.length === 0) throw new AppError('CSV is empty', 400, 'EMPTY_FILE');

        const headers = Object.keys(rows[0]);
        columnMapping = detectColumnMapping(headers);

        if (!columnMapping.name) {
            throw new AppError(
                'Could not detect a "Name" column. Please include a name column.',
                400,
                'NO_NAME_COLUMN'
            );
        }

        contacts = rows.map((r) => normalizeContact(r, columnMapping));
    } else if (isXLSX) {
        source = 'excel';
        const rows = parseXLSX(buffer);
        if (rows.length === 0) throw new AppError('Excel is empty', 400, 'EMPTY_FILE');

        const headers = Object.keys(rows[0]);
        columnMapping = detectColumnMapping(headers);

        if (!columnMapping.name) {
            throw new AppError(
                'Could not detect a "Name" column. Please include a name column.',
                400,
                'NO_NAME_COLUMN'
            );
        }

        contacts = rows.map((r) => normalizeContact(r, columnMapping));
    } else if (isPDF) {
        source = 'pdf';
        const text = await parsePDFText(buffer);

        if (!text || text.trim().length < 20) {
            throw new AppError(
                'Could not extract text from PDF. This may be a scanned PDF — AI extraction coming next.',
                400,
                'PDF_NO_TEXT'
            );
        }

        contacts = await aiExtractContacts({ text, mimeType, buffer });
    } else {
        throw new AppError('Unsupported file type. Use CSV, XLSX, or PDF.', 400, 'UNSUPPORTED_TYPE');
    }

    // Filter valid
    const valid = contacts.filter(isValidContact);
    const invalid = contacts.filter((c) => !isValidContact(c));

    return {
        source,
        columnMapping,
        total: contacts.length,
        valid_count: valid.length,
        invalid_count: invalid.length,
        contacts: valid.map((c, i) => ({ ...c, _tempId: i })),
        invalid: invalid.slice(0, 10), // preview only
    };
};

// ---------------- Duplicate Check ----------------
export const markMultiDuplicates = async (contacts, query) => {
    if (!contacts.length) return { contacts, companies: [] };

    // Unique company names from CSV
    const companyNames = [...new Set(
        contacts.map((c) => c.company?.trim()).filter(Boolean)
    )];

    if (companyNames.length === 0) {
        throw new AppError(
            'CSV must have a "Company" column for multi-company import',
            400,
            'NO_COMPANY_COLUMN'
        );
    }

    // Check which companies already exist (case-insensitive)
    const { rows: existingCompanies } = await query(
        `SELECT id, LOWER(TRIM(name)) AS name_lower, name FROM companies
     WHERE LOWER(TRIM(name)) = ANY($1::text[])`,
        [companyNames.map((n) => n.toLowerCase())]
    );

    const existingMap = new Map(
        existingCompanies.map((c) => [c.name_lower, c])
    );

    // Check existing contacts (for duplicate detection across all companies)
    const emails = contacts.map((c) => c.email).filter(Boolean);
    const phones = contacts.map((c) => c.phone).filter(Boolean);

    const { rows: existingContacts } = await query(
        `SELECT c.email, c.phone, LOWER(TRIM(co.name)) AS company_name
     FROM contacts c
     JOIN companies co ON co.id = c.company_id
     WHERE (c.email = ANY($1::text[]) OR c.phone = ANY($2::text[]))`,
        [emails, phones]
    );

    const existingContactSet = new Set(
        existingContacts.map((c) => `${c.company_name}|${c.email || c.phone}`)
    );

    // Annotate companies
    const companiesSummary = companyNames.map((name) => {
        const exists = existingMap.has(name.toLowerCase());
        const contactCount = contacts.filter(
            (c) => c.company?.trim() === name
        ).length;
        return {
            name,
            existing: exists,
            existing_id: exists ? existingMap.get(name.toLowerCase()).id : null,
            contact_count: contactCount,
        };
    });

    // Annotate contacts with duplicate flag
    const annotatedContacts = contacts.map((c) => {
        const key = `${c.company?.toLowerCase().trim()}|${c.email || c.phone}`;
        return { ...c, duplicate: existingContactSet.has(key) };
    });

    return {
        contacts: annotatedContacts,
        companies: companiesSummary,
    };
};