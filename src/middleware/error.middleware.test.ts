import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { ZodError, ZodIssue } from 'zod';
import { errorMiddleware } from './error.middleware.js';
import { AppError, NotFoundError } from '../utils/errors.js';
import { HttpStatus } from '../constants/constants.js';
import { logger } from '../services/logger/logger.factory.js';
import { config } from '../config/config.js';

vi.mock('../services/logger/logger.factory.js', () => ({
    logger: {
        log: vi.fn(),
    },
}));

vi.mock('../config/config.js', () => ({
    config: {
        env: 'development',
    },
}));

describe('errorMiddleware', () => {
    let mockReq: Partial<Request>;
    let mockRes: Partial<Response>;
    let nextFunction: NextFunction;

    beforeEach(() => {
        vi.clearAllMocks();
        mockReq = {
            method: 'GET',
            url: '/test',
            user: { userId: 'user-1' } as any,
            traceId: 'trace-1' as any,
        };
        mockRes = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn().mockReturnThis(),
        };
        nextFunction = vi.fn();
    });

    it('should handle AppError correctly', () => {
        const error = new NotFoundError('Not found');

        errorMiddleware(error, mockReq as Request, mockRes as Response, nextFunction);

        expect(mockRes.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
        expect(mockRes.json).toHaveBeenCalledWith({
            status: 'error',
            message: 'Not found',
            stack: expect.any(String),
        });
        expect(logger.log).toHaveBeenCalled();
    });

    it('should handle ZodError correctly', () => {
        const issues: ZodIssue[] = [
            {
                code: 'invalid_type',
                expected: 'string',
                received: 'number',
                path: ['body', 'email'],
                message: 'Expected string, received number',
            },
        ];
        const error = new ZodError(issues);

        errorMiddleware(error, mockReq as Request, mockRes as Response, nextFunction);

        expect(mockRes.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
        expect(mockRes.json).toHaveBeenCalledWith({
            status: 'error',
            message: 'Validation failed',
            errors: [
                { path: 'body.email', message: 'Expected string, received number' },
            ],
        });
    });

    it('should handle generic Error as 500', () => {
        const error = new Error('Generic error');

        errorMiddleware(error, mockReq as Request, mockRes as Response, nextFunction);

        expect(mockRes.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
        expect(mockRes.json).toHaveBeenCalledWith({
            status: 'error',
            message: 'Generic error',
            stack: expect.any(String),
        });
    });

    it('should not include stack trace in production', () => {
        vi.mocked(config).env = 'production';
        const error = new Error('Secure error');

        errorMiddleware(error, mockReq as Request, mockRes as Response, nextFunction);

        expect(mockRes.json).toHaveBeenCalledWith({
            status: 'error',
            message: 'Secure error',
        });
        
        // Reset for other tests
        vi.mocked(config).env = 'development';
    });
});
