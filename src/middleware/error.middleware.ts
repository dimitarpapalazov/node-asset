import { Request, Response, NextFunction } from 'express';
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
    err: Error | AppError,
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    const statusCode = err instanceof AppError ? err.statusCode : HttpStatus.INTERNAL_SERVER_ERROR;
    const message = err.message || 'An unexpected error occurred';
    
    // Log the error
    logger.log({
        timestamp: new Date().toISOString(),
        level: statusCode >= 500 ? LogLevel.ERROR : LogLevel.WARN,
        message: `${req.method} ${req.url} - ${message}`,
        userId: req.user?.userId,
        traceId: req.traceId,
        environment: config.env,
        error: err.stack,
    });

    // Send response
    res.status(statusCode).json({
        status: 'error',
        message,
        ...(config.env === 'development' && { stack: err.stack }),
    });
};
