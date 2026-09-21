import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { AppError } from '../middleware/errorHandler.js';

/**
 * Provider Abstraction:
 * Har provider ka apna "send" function hai, lekin bahar se ek hi interface.
 * Isse .env me sirf EMAIL_PROVIDER change karke switch kar sakte ho.
 */

// ============ GMAIL (SMTP via Nodemailer) ============
let gmailTransporter = null;

const getGmailTransporter = () => {
    if (gmailTransporter) return gmailTransporter;

    if (!env.email.gmail.user || !env.email.gmail.appPassword) {
        logger.warn('[email:gmail] Credentials missing — using simulation mode');
        return null;
    }

    gmailTransporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false, // STARTTLS (not SSL) — Render IPv4 friendly
        auth: {
            user: env.email.gmail.user,
            pass: env.email.gmail.appPassword,
        },
        tls: {
            rejectUnauthorized: false,
        },
        // Force IPv4 (Render doesn't support IPv6 outbound)
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 20000,
    });
    logger.info(`[email:gmail] Transporter ready for ${env.email.gmail.user}`);
    return gmailTransporter;
};

const sendViaGmail = async ({ to, subject, body, attachments = [] }) => {
    const transporter = getGmailTransporter();
    if (!transporter) {
        logger.warn(`[email:gmail] SIMULATED → ${to} | ${subject}`);
        return { providerId: `sim-gmail-${Date.now()}`, status: 'Sent', simulated: true };
    }

    const info = await transporter.sendMail({
        from: `"${env.email.fromName}" <${env.email.fromAddress || env.email.gmail.user}>`,
        to,
        subject,
        html: body,           // HTML body (agar plain text hai toh bhi chalega)
        text: body.replace(/<[^>]+>/g, ''),  // plain-text fallback
        attachments: attachments.map((a) => ({
            filename: a.file_name || a.filename,
            path: a.file_url || a.path,
        })),
    });

    logger.info(`[email:gmail] Sent → ${to} | id=${info.messageId}`);
    return { providerId: info.messageId, status: 'Sent' };
};

// ============ BREVO (Future) ============
const sendViaBrevo = async () => {
    throw new AppError('Brevo provider not configured yet', 500, 'PROVIDER_NOT_READY');
};

// ============ RESEND (Future) ============
const sendViaResend = async () => {
    throw new AppError('Resend provider not configured yet', 500, 'PROVIDER_NOT_READY');
};

// ============ PROVIDER ROUTER ============
const providers = {
    gmail: sendViaGmail,
    brevo: sendViaBrevo,
    resend: sendViaResend,
};

export const emailService = {
    async send({ to, subject, body, attachments }) {
        const fn = providers[env.email.provider];
        if (!fn) throw new AppError(`Unknown email provider: ${env.email.provider}`, 500, 'BAD_PROVIDER');
        return fn({ to, subject, body, attachments });
    },

    /**
     * Startup par connection verify karo (Gmail ke case me).
     * Agar credentials galat hain to app boot par hi pata chal jayega.
     */
    async verify() {
        if (env.email.provider !== 'gmail') return true;
        const t = getGmailTransporter();
        if (!t) return false;
        try {
            await t.verify();
            logger.info('[email:gmail] SMTP connection verified ✅');
            return true;
        } catch (e) {
            logger.error(`[email:gmail] SMTP verify FAILED: ${e.message}`);
            return false;
        }
    },
};