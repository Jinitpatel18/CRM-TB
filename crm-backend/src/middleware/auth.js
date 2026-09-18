import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import { env } from '../config/env.js';
import { AppError } from './errorHandler.js';
import { query } from '../config/database.js';

// JWKS client for ES256 (modern Supabase)
const jwks = env.supabase.jwksUrl
    ? jwksClient({
        jwksUri: env.supabase.jwksUrl,
        cache: true,
        cacheMaxAge: 600_000, // 10 min
        rateLimit: true,
    })
    : null;

const getSigningKey = (header, callback) => {
    if (!jwks) return callback(new Error('JWKS not configured'));
    jwks.getSigningKey(header.kid, (err, key) => {
        if (err) return callback(err);
        callback(null, key.getPublicKey());
    });
};

/**
 * Verify Supabase JWT (supports both HS256 and ES256)
 */
const verifyToken = (token) =>
    new Promise((resolve, reject) => {
        // Decode header first to detect algorithm
        const decoded = jwt.decode(token, { complete: true });
        if (!decoded) return reject(new Error('Malformed token'));

        const alg = decoded.header.alg;

        if (alg === 'HS256') {
            // Symmetric — use JWT_SECRET
            jwt.verify(
                token,
                env.supabase.jwtSecret,
                { algorithms: ['HS256'] },
                (err, payload) => (err ? reject(err) : resolve(payload))
            );
        } else if (alg === 'ES256' || alg === 'RS256') {
            // Asymmetric — use JWKS
            jwt.verify(
                token,
                getSigningKey,
                { algorithms: ['ES256', 'RS256'] },
                (err, payload) => (err ? reject(err) : resolve(payload))
            );
        } else {
            reject(new Error(`Unsupported algorithm: ${alg}`));
        }
    });

export const requireAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
            throw new AppError('Missing authorization token', 401, 'UNAUTHORIZED');
        }

        const token = authHeader.slice(7);
        let payload;

        try {
            payload = await verifyToken(token);
        } catch (err) {
            console.error('[auth] Token verify failed:', err.message);
            throw new AppError(
                err.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token',
                401,
                'UNAUTHORIZED'
            );
        }

        const { rows } = await query(
            `SELECT id, email, full_name, role, status FROM user_profiles WHERE id = $1`,
            [payload.sub]
        );

        const profile = rows[0];
        if (!profile) {
            throw new AppError('User profile not found', 403, 'PROFILE_MISSING');
        }
        if (profile.status !== 'active') {
            throw new AppError('Account is inactive', 403, 'ACCOUNT_INACTIVE');
        }

        req.user = {
            id: profile.id,
            email: profile.email,
            fullName: profile.full_name,
            role: profile.role,
        };

        next();
    } catch (e) {
        next(e);
    }
};

export const requireRole = (...allowedRoles) => (req, res, next) => {
    if (!req.user) {
        return next(new AppError('Authentication required', 401, 'UNAUTHORIZED'));
    }
    if (!allowedRoles.includes(req.user.role)) {
        return next(
            new AppError(
                `Access denied. Requires one of: ${allowedRoles.join(', ')}`,
                403,
                'FORBIDDEN'
            )
        );
    }
    next();
};