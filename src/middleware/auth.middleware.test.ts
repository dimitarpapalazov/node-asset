import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { authenticate } from './auth.middleware.js';
import { UnauthorizedError } from '../utils/errors.js';
import jwt from 'jsonwebtoken';

vi.mock('jsonwebtoken');
vi.mock('../config/config.js', () => ({
    config: {
        jwt: { accessSecret: 'test-secret' }
    }
}));

describe('Auth Middleware', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let next: NextFunction;

    beforeEach(() => {
        mockRequest = { headers: {} };
        mockResponse = {};
        next = vi.fn();
    });

    it('should throw UnauthorizedError if no authorization header', () => {
        expect(() => authenticate(mockRequest as Request, mockResponse as Response, next)).toThrow(UnauthorizedError);
    });

    it('should throw UnauthorizedError if invalid header format', () => {
        mockRequest.headers = { authorization: 'Basic token' };
        expect(() => authenticate(mockRequest as Request, mockResponse as Response, next)).toThrow(UnauthorizedError);
    });

    it('should call next if token is valid', () => {
        mockRequest.headers = { authorization: 'Bearer valid-token' };
        (jwt.verify as any).mockReturnValue({ userId: '1' });

        authenticate(mockRequest as Request, mockResponse as Response, next);

        expect(next).toHaveBeenCalled();
        expect((mockRequest as any).user).toEqual({ userId: '1' });
    });
});
