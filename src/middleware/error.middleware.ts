import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/errors.js';
import { HttpStatus } from '../constants/constants.js';
import { logger } from '../services/logger/logger.factory.js';
import { LogLevel } from '../services/logger/index.js';
import { config } from '../config/config.js';

/**
 * Global error handling middleware.
 * Catch-all for errors thrown in routes or other middleware.
 */
export const errorMiddleware = (
    err: Error | AppError | ZodError,
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'An unexpected error occurred';
    let errors: any[] | undefined;

    if (err instanceof AppError) {
        statusCode = err.statusCode;
        message = err.message;
    } else if (err instanceof ZodError) {
        statusCode = HttpStatus.BAD_REQUEST;
        message = 'Validation failed';
        errors = err.issues.map((e) => ({
            path: e.path.join('.'),
            message: e.message,
        }));
    } else if (err instanceof Error) {
        message = err.message;
    }
    
    // Log the error
    logger.log({
        timestamp: new Date().toISOString(),
        level: statusCode >= 500 ? LogLevel.ERROR : LogLevel.WARN,
        message: `${req.method} ${req.url} - ${message}`,
        userId: req.user?.userId,
        traceId: req.traceId,
        environment: config.env,
        error: err instanceof Error ? err.stack : JSON.stringify(err),
    });

    // Send response
    res.status(statusCode).json({
        status: 'error',
        message,
        ...(errors && { errors }),
        ...(config.env === 'development' && err instanceof Error && { stack: err.stack }),
    });
};
