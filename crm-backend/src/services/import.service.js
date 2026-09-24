import { parse as csvParse } from 'csv-parse/sync';
import * as XLSX from 'xlsx';
import { GoogleGenAI } from '@google/genai';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { AppError } from '../middleware/errorHandler.js';

// ---------------- AI Client (new SDK) ----------------
const genAI = env.gemini?.apiKey
    ? new GoogleGenAI({ apiKey: env.gemini.apiKey })
    : null;

const AI_MODEL = 'gemini-flash-latest';

// ---------------- Column Detection Patterns ----------------
// Order matters: more specific patterns first
const COLUMN_PATTERNS = {
    // Company Email BEFORE email (more specific)
    company_email: [
        /company.?email/i,
        /org.?email/i,
        /organisation.?email/i,
        /organization.?email/i,
        /business.?email/i,
        /corporate.?email/i,
        /office.?email/i,
    ],
    // Person Name
    name: [
        /^name$/i,
        /full.?name/i,
        /contact.?name/i,
        /customer.?name/i,
        /^person$/i,
        /^naam$/i,
        /^client$/i,
    ],
    first_name: [/first.?name/i, /given.?name/i, /^fname$/i],
    last_name: [/last.?name/i, /surname/i, /family.?name/i, /^lname$/i],
    // Personal email AFTER company_email
    email: [
        /^email$/i,
        /^e?.?mail$/i,
        /email.?address/i,
        /personal.?email/i,
        /contact.?email/i,
    ],
    phone: [
        /phone/i,
        /mobile/i,
        /contact.?no/i,
        /number/i,
        /whatsapp/i,
        /cell/i,
        /^tel$/i,
    ],
    role: [/role/i, /title/i, /designation/i, /position/i, /job/i],
    company: [
        /^company$/i,
        /company.?name/i,
        /organi[sz]ation/i,
        /^org$/i,
        /firm/i,
        /business.?name/i,
    ],
};

// ---------------- Column Auto-Detection ----------------
const detectColumnMapping = (headers) => {
    const mapping = {};
    const usedHeaders = new Set(); // prevent one header being mapped to 2 fields

    for (const [field, patterns] of Object.entries(COLUMN_PATTERNS)) {
        for (const header of headers) {
            if (usedHeaders.has(header)) continue;
            if (patterns.some((p) => p.test(String(header).trim()))) {
                mapping[field] = header;
                usedHeaders.add(header);
                break;
            }
        }
    }
    return mapping;
};

// ---------------- Row Normalization ----------------
const normalizeContact = (row, mapping) => {
    // Build name — either direct or combine First + Last
    let name = '';
    if (mapping.name) {
        name = String(row[mapping.name] ?? '').trim();
    } else if (mapping.first_name || mapping.last_name) {
        const first = mapping.first_name ? String(row[mapping.first_name] ?? '').trim() : '';
        const last = mapping.last_name ? String(row[mapping.last_name] ?? '').trim() : '';
        name = [first, last].filter(Boolean).join(' ');
    }

    return {
        name: name || null,
        email: String(row[mapping.email] ?? '').trim().toLowerCase() || null,
        phone: String(row[mapping.phone] ?? '').trim().replace(/[^\d+\-() ]/g, '') || null,
        role: String(row[mapping.role] ?? '').trim() || null,
        company: String(row[mapping.company] ?? '').trim() || null,
        company_email: String(row[mapping.company_email] ?? '').trim().toLowerCase() || null,
    };
};

const isValidContact = (c) => c.name && (c.email || c.phone);

// ---------------- Parsers ----------------
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

const parseXLSX = (buffer) => {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    return XLSX.utils.sheet_to_json(firstSheet, { defval: '' });
};

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

// ---------------- AI Extraction ----------------
const aiExtractContacts = async ({ text }) => {
    if (!genAI) {
        throw new AppError(
            'AI extraction not configured. Add GEMINI_API_KEY to .env',
            400,
            'AI_NOT_CONFIGURED'
        );
    }

    const prompt = `Extract all contacts from the following content. Return ONLY valid JSON array (no markdown, no extra text) with this exact schema:
[
  {
    "name": "Full Name",
    "email": "email@example.com",
    "phone": "+91 9876543210",
    "role": "Job Title",
    "company": "Company Name",
    "company_email": "company@example.com or null"
  }
]

Rules:
- name is required; skip entries without a name
- email and phone are optional but at least one should be present
- role, company, and company_email are optional
- If no contacts found, return []

Content:
${text}`;

    try {
        const result = await genAI.models.generateContent({
            model: AI_MODEL,
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                temperature: 0.2,
            },
        });

        let cleaned = String(result.text || '')
            .replace(/```json\s*/gi, '')
            .replace(/```\s*/g, '')
            .trim();

        const match = cleaned.match(/\[[\s\S]*\]/);
        if (match) cleaned = match[0];

        const contacts = JSON.parse(cleaned);
        return Array.isArray(contacts) ? contacts : [];
    } catch (err) {
        logger.error(`[import] AI extraction failed: ${err.message}`);
        throw new AppError(`AI extraction failed: ${err.message}`, 500, 'AI_FAILED');
    }
};

// ============================================================
// MAIN EXPORT 1: parseImportFile (legacy — auto-detect)
// ============================================================
export const parseImportFile = async ({ buffer, fileName, mimeType }) => {
    const lowerName = fileName.toLowerCase();
    let contacts = [];
    let source = 'unknown';
    let columnMapping = null;

    const isCSV = lowerName.endsWith('.csv') || mimeType === 'text/csv';
    const isXLSX =
        lowerName.endsWith('.xlsx') ||
        lowerName.endsWith('.xls') ||
        mimeType?.includes('spreadsheet') ||
        mimeType?.includes('excel');
    const isPDF = lowerName.endsWith('.pdf') || mimeType === 'application/pdf';

    if (isCSV || isXLSX) {
        source = isCSV ? 'csv' : 'excel';
        const rows = isCSV ? parseCSV(buffer) : parseXLSX(buffer);
        if (rows.length === 0) throw new AppError('File is empty', 400, 'EMPTY_FILE');

        const headers = Object.keys(rows[0]);
        columnMapping = detectColumnMapping(headers);

        if (!columnMapping.name && !columnMapping.first_name) {
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
        contacts = await aiExtractContacts({ text });
    } else {
        throw new AppError('Unsupported file type. Use CSV, XLSX, or PDF.', 400, 'UNSUPPORTED_TYPE');
    }

    const valid = contacts.filter(isValidContact);
    const invalid = contacts.filter((c) => !isValidContact(c));

    return {
        source,
        columnMapping,
        total: contacts.length,
        valid_count: valid.length,
        invalid_count: invalid.length,
        contacts: valid.map((c, i) => ({ ...c, _tempId: i })),
        invalid: invalid.slice(0, 10),
    };
};

// ============================================================
// MAIN EXPORT 2: parseImportFileWithMapping (with column mapping)
// ============================================================
export const parseImportFileWithMapping = async ({
    buffer,
    fileName,
    mimeType,
    columnMapping = null,
}) => {
    const lowerName = fileName.toLowerCase();

    const isCSV = lowerName.endsWith('.csv') || mimeType === 'text/csv';
    const isXLSX =
        lowerName.endsWith('.xlsx') ||
        lowerName.endsWith('.xls') ||
        mimeType?.includes('spreadsheet') ||
        mimeType?.includes('excel');

    // PDF → fallback to legacy (AI extraction)
    if (!isCSV && !isXLSX) {
        const result = await parseImportFile({ buffer, fileName, mimeType });
        return { ...result, mode: 'ai' };
    }

    const source = isCSV ? 'csv' : 'excel';
    const rows = isCSV ? parseCSV(buffer) : parseXLSX(buffer);

    if (rows.length === 0) throw new AppError('File is empty', 400, 'EMPTY_FILE');

    const headers = Object.keys(rows[0]);

    // If no mapping provided → return detection data (for mapping UI)
    if (!columnMapping) {
        const autoMapping = detectColumnMapping(headers);
        return {
            source,
            headers,
            sampleRows: rows.slice(0, 5),
            autoMapping,
            totalRows: rows.length,
        };
    }

    // Mapping provided → extract contacts
    const contacts = rows.map((r) => normalizeContact(r, columnMapping));
    const valid = contacts.filter(isValidContact);
    const invalid = contacts.filter((c) => !isValidContact(c));

    return {
        source,
        columnMapping,
        total: contacts.length,
        valid_count: valid.length,
        invalid_count: invalid.length,
        contacts: valid.map((c, i) => ({ ...c, _tempId: i })),
        invalid: invalid.slice(0, 10),
    };
};

// ============================================================
// MAIN EXPORT 3: markDuplicates (single company)
// ============================================================
export const markDuplicates = async (contacts, companyId, query) => {
    if (!contacts.length) return contacts;

    const emails = contacts.map((c) => c.email).filter(Boolean);
    const phones = contacts.map((c) => c.phone).filter(Boolean);

    const { rows } = await query(
        `SELECT email, phone FROM contacts 
     WHERE company_id = $1 
       AND (email = ANY($2::text[]) OR phone = ANY($3::text[]))`,
        [companyId, emails, phones]
    );

    const existingEmails = new Set(rows.map((r) => r.email).filter(Boolean));
    const existingPhones = new Set(rows.map((r) => r.phone).filter(Boolean));

    return contacts.map((c) => {
        const isDup =
            (c.email && existingEmails.has(c.email)) ||
            (c.phone && existingPhones.has(c.phone));
        return { ...c, duplicate: !!isDup };
    });
};

// ============================================================
// MAIN EXPORT 4: markMultiDuplicates (multi-company)
// ============================================================
export const markMultiDuplicates = async (contacts, query) => {
    if (!contacts.length) return { contacts, companies: [] };

    const companyNames = [
        ...new Set(contacts.map((c) => c.company?.trim()).filter(Boolean)),
    ];

    if (companyNames.length === 0) {
        throw new AppError(
            'CSV must have a "Company" column for multi-company import',
            400,
            'NO_COMPANY_COLUMN'
        );
    }

    const { rows: existingCompanies } = await query(
        `SELECT id, LOWER(TRIM(name)) AS name_lower, name FROM companies
     WHERE LOWER(TRIM(name)) = ANY($1::text[])`,
        [companyNames.map((n) => n.toLowerCase())]
    );

    const existingMap = new Map(existingCompanies.map((c) => [c.name_lower, c]));

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

    const annotatedContacts = contacts.map((c) => {
        const key = `${c.company?.toLowerCase().trim()}|${c.email || c.phone}`;
        return { ...c, duplicate: existingContactSet.has(key) };
    });

    return {
        contacts: annotatedContacts,
        companies: companiesSummary,
    };
};