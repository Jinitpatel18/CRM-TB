// export const env = {
//     nodeEnv: process.env.NODE_ENV || 'development',
//     port: Number(process.env.PORT || 4000),
//     databaseUrl: process.env.DATABASE_URL,
//     redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
//     supabase: {
//         url: process.env.SUPABASE_URL,
//         key: process.env.SUPABASE_SERVICE_ROLE_KEY,
//         bucket: process.env.SUPABASE_BUCKET || 'crm-attachments',
//     },
//     google: {
//         clientId: process.env.GOOGLE_CLIENT_ID,
//         clientSecret: process.env.GOOGLE_CLIENT_SECRET,
//         redirectUri: process.env.GOOGLE_REDIRECT_URI,
//     },
//     email: {
//         provider: process.env.EMAIL_PROVIDER || 'gmail',
//         fromName: process.env.EMAIL_FROM_NAME || 'CRM',
//         fromAddress: process.env.EMAIL_FROM_ADDRESS,
//         gmail: {
//             user: process.env.GMAIL_USER,
//             appPassword: process.env.GMAIL_APP_PASSWORD,
//         },
//         // Future providers ke liye jagah
//         brevo: {
//             apiKey: process.env.BREVO_API_KEY,
//         },
//         resend: {
//             apiKey: process.env.RESEND_API_KEY,
//         },
//     },
//     whatsapp: {
//         enabled: process.env.WHATSAPP_ENABLED === 'true',   // default: OFF
//         sid: process.env.TWILIO_ACCOUNT_SID,
//         token: process.env.TWILIO_AUTH_TOKEN,
//         from: process.env.TWILIO_WHATSAPP_FROM,
//     },
// };

// src/config/env.js
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Get __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// .env is at PROJECT ROOT (2 levels up from src/config/)
// src/config/env.js → ../../.env
const envPath = resolve(__dirname, '../../.env');

console.log('🔍 Loading .env from:', envPath);

const result = dotenv.config({ path: envPath });

if (result.error) {
    console.error('❌ Failed to load .env:', result.error.message);
    console.error('   Current working directory:', process.cwd());
    console.error('   Looking for .env at:', envPath);
} else {
    console.log('✅ .env loaded successfully');
    console.log('   Keys found:', Object.keys(result.parsed || {}).length);
}

export const env = {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: Number(process.env.PORT || 4000),
    databaseUrl: process.env.DATABASE_URL,
    redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
    supabase: {
        url: process.env.SUPABASE_URL,
        key: process.env.SUPABASE_SERVICE_ROLE_KEY,
        jwtSecret: process.env.SUPABASE_JWT_SECRET,      // legacy (HS256)
        jwksUrl: process.env.SUPABASE_JWKS_URL,          // modern (ES256)
        bucket: process.env.SUPABASE_BUCKET || 'crm-attachments',
    },
    google: {
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        redirectUri: process.env.GOOGLE_REDIRECT_URI,
    },
    email: {
        provider: process.env.EMAIL_PROVIDER || 'gmail',
        fromName: process.env.EMAIL_FROM_NAME || 'CRM',
        fromAddress: process.env.EMAIL_FROM_ADDRESS,
        gmail: {
            user: process.env.GMAIL_USER,
            appPassword: process.env.GMAIL_APP_PASSWORD,
        },
        brevo: { apiKey: process.env.BREVO_API_KEY },
        resend: { apiKey: process.env.RESEND_API_KEY },
    },
    whatsapp: {
        enabled: process.env.WHATSAPP_ENABLED === 'true',
        sid: process.env.TWILIO_ACCOUNT_SID,
        token: process.env.TWILIO_AUTH_TOKEN,
        from: process.env.TWILIO_WHATSAPP_FROM,
    },
    gemini: {
        apiKey: process.env.GEMINI_API_KEY,
},
};