import { google } from 'googleapis';
import { env } from '../config/env.js';
import { query } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { AppError } from '../middleware/errorHandler.js';

const PROVIDER = 'google';

export const oauth2Client = new google.auth.OAuth2(
    env.google.clientId,
    env.google.clientSecret,
    env.google.redirectUri
);

const SCOPES = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/userinfo.email',
];

export const getAuthUrl = () =>
    oauth2Client.generateAuthUrl({
        access_type: 'offline',
        prompt: 'consent',
        scope: SCOPES,
    });

export const exchangeCodeForTokens = async (code) => {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Get user email
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const { data: userInfo } = await oauth2.userinfo.get();

    const expiresAt = tokens.expiry_date
        ? new Date(tokens.expiry_date)
        : new Date(Date.now() + 3600 * 1000);

    await query(
        `INSERT INTO oauth_tokens (provider, access_token, refresh_token, expires_at, scope, email)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (provider) DO UPDATE SET
       access_token = EXCLUDED.access_token,
       refresh_token = COALESCE(EXCLUDED.refresh_token, oauth_tokens.refresh_token),
       expires_at = EXCLUDED.expires_at,
       scope = EXCLUDED.scope,
       email = EXCLUDED.email,
       updated_at = NOW()`,
        [
            PROVIDER,
            tokens.access_token,
            tokens.refresh_token || null,
            expiresAt,
            tokens.scope,
            userInfo.email,
        ]
    );

    logger.info(`[googleAuth] Tokens saved for ${userInfo.email}`);
    return { email: userInfo.email, tokens };
};

export const getConnectedAccount = async () => {
    const { rows } = await query(
        `SELECT id, email, expires_at, updated_at FROM oauth_tokens WHERE provider = $1`,
        [PROVIDER]
    );
    return rows[0] || null;
};

export const isConnected = async () => !!(await getConnectedAccount());

export const disconnect = async () => {
    await query(`DELETE FROM oauth_tokens WHERE provider = $1`, [PROVIDER]);
    logger.info('[googleAuth] Disconnected');
};

/**
 * Returns an authenticated oauth2Client with valid access token.
 * Auto-refreshes if expired.
 */
export const getAuthenticatedClient = async () => {
    const { rows } = await query(`SELECT * FROM oauth_tokens WHERE provider = $1`, [PROVIDER]);
    const row = rows[0];

    if (!row) {
        throw new AppError(
            'Google account not connected. Please connect from Settings.',
            400,
            'GOOGLE_NOT_CONNECTED'
        );
    }

    oauth2Client.setCredentials({
        access_token: row.access_token,
        refresh_token: row.refresh_token,
        expiry_date: row.expires_at ? new Date(row.expires_at).getTime() : null,
    });

    // Auto-refresh if expired
    const expiresAt = row.expires_at ? new Date(row.expires_at).getTime() : 0;
    if (expiresAt < Date.now() + 60_000) {
        logger.info('[googleAuth] Access token expired — refreshing...');
        try {
            const { credentials } = await oauth2Client.refreshAccessToken();
            const newExpiry = credentials.expiry_date
                ? new Date(credentials.expiry_date)
                : new Date(Date.now() + 3600 * 1000);

            await query(
                `UPDATE oauth_tokens 
         SET access_token = $1, expires_at = $2, updated_at = NOW()
         WHERE provider = $3`,
                [credentials.access_token, newExpiry, PROVIDER]
            );

            oauth2Client.setCredentials(credentials);
            logger.info('[googleAuth] Token refreshed ✅');
        } catch (err) {
            logger.error(`[googleAuth] Refresh failed: ${err.message}`);
            throw new AppError(
                'Google token expired. Please reconnect from Settings.',
                401,
                'GOOGLE_TOKEN_EXPIRED'
            );
        }
    }

    return oauth2Client;
};