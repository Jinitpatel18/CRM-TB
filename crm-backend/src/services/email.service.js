import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { AppError } from '../middleware/errorHandler.js';

// ============ BREVO (API — Render friendly) ============
const sendViaBrevo = async ({ to, subject, body, attachments = [] }) => {
    if (!env.email.brevo?.apiKey) {
        logger.warn('[email:brevo] API key missing — using simulation mode');
        return { providerId: `sim-brevo-${Date.now()}`, status: 'Sent', simulated: true };
    }

    const payload = {
        sender: {
            name: env.email.fromName || 'CRM',
            email: env.email.fromAddress,
        },
        to: [{ email: to }],
        subject: subject || '(no subject)',
        htmlContent: body || '',
        textContent: String(body || '').replace(/<[^>]+>/g, ''),
    };

    if (attachments.length > 0) {
        payload.attachment = attachments.map((a) => ({
            name: a.file_name || a.filename || 'attachment',
            url: a.file_url || a.path,
        }));
    }

    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
            'api-key': env.email.brevo.apiKey,
            'Content-Type': 'application/json',
            Accept: 'application/json',
        },
        body: JSON.stringify(payload),
    });

    const json = await res.json();

    if (!res.ok) {
        logger.error(`[email:brevo] Failed: ${JSON.stringify(json)}`);
        throw new AppError(
            `Email send failed: ${json.message || res.statusText}`,
            500,
            'EMAIL_FAILED'
        );
    }

    logger.info(`[email:brevo] Sent → ${to} | id=${json.messageId}`);
    return { providerId: json.messageId, status: 'Sent' };
};

// ============ GMAIL SMTP (local dev only) ============
let gmailTransporter = null;

const getGmailTransporter = () => {
    if (gmailTransporter) return gmailTransporter;

    if (!env.email.gmail.user || !env.email.gmail.appPassword) {
        logger.warn('[email:gmail] Credentials missing — simulation mode');
        return null;
    }

    gmailTransporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
            user: env.email.gmail.user,
            pass: env.email.gmail.appPassword,
        },
        tls: { rejectUnauthorized: false },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 20000,
    });

    return gmailTransporter;
};

const sendViaGmail = async ({ to, subject, body, attachments = [] }) => {
    const transporter = getGmailTransporter();
    if (!transporter) {
        logger.warn(`[email:gmail] SIMULATED → ${to}`);
        return { providerId: `sim-gmail-${Date.now()}`, status: 'Sent', simulated: true };
    }

    const info = await transporter.sendMail({
        from: `"${env.email.fromName}" <${env.email.fromAddress || env.email.gmail.user}>`,
        to,
        subject,
        html: body,
        text: String(body || '').replace(/<[^>]+>/g, ''),
        attachments: attachments.map((a) => ({
            filename: a.file_name || a.filename,
            path: a.file_url || a.path,
        })),
    });

    logger.info(`[email:gmail] Sent → ${to} | id=${info.messageId}`);
    return { providerId: info.messageId, status: 'Sent' };
};

// ============ PROVIDER ROUTER ============
const providers = {
    gmail: sendViaGmail,
    brevo: sendViaBrevo,
};

export const emailService = {
    async send({ to, subject, body, attachments }) {
        const fn = providers[env.email.provider];
        if (!fn) {
            throw new AppError(`Unknown email provider: ${env.email.provider}`, 500, 'BAD_PROVIDER');
        }
        return fn({ to, subject, body, attachments });
    },

    async verify() {
        if (env.email.provider === 'brevo') {
            logger.info('[email:brevo] Using API provider ✅');
            return true;
        }
        if (env.email.provider !== 'gmail') return true;
        const t = getGmailTransporter();
        if (!t) return false;
        try {
            await t.verify();
            logger.info('[email:gmail] SMTP verified ✅');
            return true;
        } catch (e) {
            logger.error(`[email:gmail] SMTP verify FAILED: ${e.message}`);
            return false;
        }
    },
};