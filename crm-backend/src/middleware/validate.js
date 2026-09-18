import { AppError } from './errorHandler.js';

export const validate = (schema, source = 'body') => (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
        return next(
            new AppError('Validation failed', 400, 'VALIDATION_ERROR')
        ) || res.status(400).json({
            success: false,
            error: {
                code: 'VALIDATION_ERROR',
                message: 'Validation failed',
                details: result.error.flatten(),
            },
        });
    }
    req[source] = result.data;
    next();
};