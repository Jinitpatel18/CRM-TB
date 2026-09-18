import { query } from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';

export const listUsers = async () => {
    const { rows } = await query(
        `SELECT id, email, full_name, role, status, created_at
     FROM user_profiles
     ORDER BY 
       CASE role WHEN 'admin' THEN 1 WHEN 'sales' THEN 2 WHEN 'viewer' THEN 3 END,
       created_at ASC`
    );
    return rows;
};

export const updateUserRole = async (id, role) => {
    if (!['admin', 'sales', 'viewer'].includes(role)) {
        throw new AppError('Invalid role', 400, 'INVALID_ROLE');
    }

    // Prevent removing last admin
    if (role !== 'admin') {
        const { rows } = await query(
            `SELECT COUNT(*)::int AS count FROM user_profiles WHERE role = 'admin' AND id != $1`,
            [id]
        );
        if (rows[0].count === 0) {
            throw new AppError('Cannot remove the last admin', 400, 'LAST_ADMIN');
        }
    }

    const { rows } = await query(
        `UPDATE user_profiles SET role = $2, updated_at = NOW() WHERE id = $1
     RETURNING id, email, full_name, role, status`,
        [id, role]
    );
    if (!rows[0]) throw new AppError('User not found', 404, 'NOT_FOUND');
    return rows[0];
};

export const updateUserStatus = async (id, status) => {
    if (!['active', 'inactive'].includes(status)) {
        throw new AppError('Invalid status', 400, 'INVALID_STATUS');
    }

    // Prevent deactivating last active admin
    if (status === 'inactive') {
        const { rows } = await query(
            `SELECT role FROM user_profiles WHERE id = $1`,
            [id]
        );
        if (rows[0]?.role === 'admin') {
            const { rows: admins } = await query(
                `SELECT COUNT(*)::int AS count FROM user_profiles 
         WHERE role = 'admin' AND status = 'active' AND id != $1`,
                [id]
            );
            if (admins[0].count === 0) {
                throw new AppError('Cannot deactivate the last active admin', 400, 'LAST_ADMIN');
            }
        }
    }

    const { rows } = await query(
        `UPDATE user_profiles SET status = $2, updated_at = NOW() WHERE id = $1
     RETURNING id, email, full_name, role, status`,
        [id, status]
    );
    if (!rows[0]) throw new AppError('User not found', 404, 'NOT_FOUND');
    return rows[0];
};

export const getUserProfile = async (id) => {
    const { rows } = await query(
        `SELECT id, email, full_name, role, status, created_at FROM user_profiles WHERE id = $1`,
        [id]
    );
    return rows[0];
};