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
        mockRequest = { cookies: {} };
        mockResponse = {};
        next = vi.fn();
    });

    it('should throw UnauthorizedError if no accessToken cookie', () => {
        expect(() => authenticate(mockRequest as Request, mockResponse as Response, next)).toThrow(UnauthorizedError);
    });

    it('should call next if accessToken cookie is valid', () => {
        mockRequest.cookies = { accessToken: 'valid-token' };
        (jwt.verify as any).mockReturnValue({ userId: '1' });

        authenticate(mockRequest as Request, mockResponse as Response, next);

        expect(next).toHaveBeenCalled();
        expect((mockRequest as any).user).toEqual({ userId: '1' });
    });
});
