import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';
import { query } from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';
import { logger } from '../utils/logger.js';

const supabase = createClient(env.supabase.url, env.supabase.key, {
    auth: { persistSession: false },
});

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

export const uploadFile = async ({ activityId, buffer, fileName, mimeType, userId }) => {
    if (!buffer || buffer.length === 0) {
        throw new AppError('Empty file', 400, 'EMPTY_FILE');
    }
    if (buffer.length > MAX_SIZE) {
        throw new AppError('File too large (max 10 MB)', 400, 'FILE_TOO_LARGE');
    }

    const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const folder = activityId ? `activities/${activityId}` : `uploads/${userId}`;
    const path = `${folder}/${Date.now()}-${safeName}`;

    const { error: uploadError } = await supabase.storage
        .from(env.supabase.bucket)
        .upload(path, buffer, {
            contentType: mimeType || 'application/octet-stream',
            upsert: false,
        });

    if (uploadError) {
        logger.error(`[file] upload failed: ${uploadError.message}`);
        throw new AppError(`Upload failed: ${uploadError.message}`, 500, 'UPLOAD_FAILED');
    }

    const { data: urlData } = supabase.storage
        .from(env.supabase.bucket)
        .getPublicUrl(path);

    const publicUrl = urlData.publicUrl;

    const { rows } = await query(
        `INSERT INTO activity_files (activity_id, file_name, file_url, file_type)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
        [activityId || null, fileName, publicUrl, mimeType || null]
    );

    logger.info(`[file] uploaded ${fileName} (${(buffer.length / 1024).toFixed(1)} KB)`);

    return {
        ...rows[0],
        size: buffer.length,
        storage_path: path,
    };
};

export const getActivityFiles = async (activityId) => {
    const { rows } = await query(
        `SELECT * FROM activity_files WHERE activity_id = $1 ORDER BY uploaded_at`,
        [activityId]
    );
    return rows;
};

export const linkFilesToActivity = async (fileIds, activityId) => {
    if (!fileIds?.length) return [];

    await query(
        `UPDATE activity_files SET activity_id = $1 WHERE id = ANY($2::int[])`,
        [activityId, fileIds]
    );

    return getActivityFiles(activityId);
};

export const deleteFile = async (fileId) => {
    const { rows } = await query(
        `SELECT * FROM activity_files WHERE id = $1`,
        [fileId]
    );
    const file = rows[0];
    if (!file) throw new AppError('File not found', 404, 'NOT_FOUND');

    const url = new URL(file.file_url);
    const pathMatch = url.pathname.match(/\/object\/public\/[^/]+\/(.+)$/);
    const storagePath = pathMatch?.[1];

    if (storagePath) {
        await supabase.storage.from(env.supabase.bucket).remove([storagePath]);
    }

    await query(`DELETE FROM activity_files WHERE id = $1`, [fileId]);

    return { deleted: true };
};