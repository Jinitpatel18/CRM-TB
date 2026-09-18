import pg from 'pg';
import { env } from './env.js';

const { Pool } = pg;
export const pool = new Pool({
    connectionString: env.databaseUrl,
    max: 20,
    idleTimeoutMillis: 30_000,
});

pool.on('error', (err) => console.error('[pg] idle client error', err));

export const query = (text, params) => pool.query(text, params);

export const withTransaction = async (fn) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const result = await fn(client);
        await client.query('COMMIT');
        return result;
    } catch (e) {
        await client.query('ROLLBACK');
        throw e;
    } finally {
        client.release();
    }
};