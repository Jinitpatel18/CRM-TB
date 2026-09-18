import { logger } from '../utils/logger.js';

export class AppError extends Error {
    constructor(message, status = 500, code = 'INTERNAL_ERROR') {
        super(message);
        this.status = status;
        this.code = code;
    }
}

export const notFound = (req, res, next) =>
    next(new AppError(`Route ${req.method} ${req.originalUrl} not found`, 404, 'NOT_FOUND'));

export const errorHandler = (err, req, res, _next) => {
    const status = err.status || 500;
    logger.error({ message: err.message, code: err.code, stack: err.stack });
    res.status(status).json({
        success: false,
        error: {
            code: err.code || 'INTERNAL_ERROR',
            message: err.message || 'Something went wrong',
            ...(err.details ? { details: err.details } : {}),
        },
    });
};