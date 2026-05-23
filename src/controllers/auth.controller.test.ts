import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';
import * as authController from './auth.controller.js';
import * as authService from '../services/auth.service.js';
import * as userService from '../services/user.service.js';
import { HttpStatus } from '../constants/constants.js';

vi.mock('../services/auth.service.js');
vi.mock('../services/user.service.js');
vi.mock('../config/config.js', () => ({
    config: {
        port: 3000,
        db: {
            host: 'localhost',
            port: 5432,
            user: 'test',
            pass: 'test',
            name: 'test',
            url: 'postgres://test:test@localhost:5432/test',
        },
        jwt: {
            accessSecret: 'test-secret',
            refreshSecret: 'test-refresh-secret',
            accessExpiry: '15m',
            refreshExpiry: '7d',
        }
    }
}));

describe('authController', () => {
    let mockReq: Partial<Request>;
    let mockRes: Partial<Response>;

    beforeEach(() => {
        mockReq = { body: {}, cookies: {} };
        mockRes = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn(),
            send: vi.fn(),
            cookie: vi.fn(),
            clearCookie: vi.fn(),
        };
    });

    describe('register', () => {
        it('should register a user and set cookies', async () => {
            mockReq.body = { email: 'test@example.com', password: 'password' };
            const user = { id: '1', email: 'test@example.com' };
            const tokens = { accessToken: 'at', refreshToken: 'rt' };
            vi.spyOn(userService, 'createUser').mockResolvedValue(user as any);
            vi.spyOn(authService, 'login').mockResolvedValue(tokens);

            await authController.register(mockReq as Request, mockRes as Response);

            expect(mockRes.status).toHaveBeenCalledWith(HttpStatus.CREATED);
            expect(mockRes.cookie).toHaveBeenCalledWith('accessToken', tokens.accessToken, expect.any(Object));
            expect(mockRes.cookie).toHaveBeenCalledWith('refreshToken', tokens.refreshToken, expect.any(Object));
            expect(mockRes.json).toHaveBeenCalledWith({ user });
        });
    });

    describe('login', () => {
        it('should login a user and set cookies', async () => {
            mockReq.body = { email: 'test@example.com', password: 'password' };
            const tokens = { accessToken: 'at', refreshToken: 'rt' };
            vi.spyOn(authService, 'login').mockResolvedValue(tokens);

            await authController.login(mockReq as Request, mockRes as Response);

            expect(mockRes.status).toHaveBeenCalledWith(HttpStatus.OK);
            expect(mockRes.cookie).toHaveBeenCalledWith('accessToken', tokens.accessToken, expect.any(Object));
            expect(mockRes.cookie).toHaveBeenCalledWith('refreshToken', tokens.refreshToken, expect.any(Object));
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Logged in successfully' });
        });
    });

    describe('refresh', () => {
        it('should refresh tokens from cookie', async () => {
            mockReq.cookies = { refreshToken: 'rt' };
            const tokens = { accessToken: 'at', refreshToken: 'new_rt' };
            vi.spyOn(authService, 'refresh').mockResolvedValue(tokens);

            await authController.refresh(mockReq as Request, mockRes as Response);

            expect(mockRes.status).toHaveBeenCalledWith(HttpStatus.OK);
            expect(mockRes.cookie).toHaveBeenCalledWith('accessToken', tokens.accessToken, expect.any(Object));
            expect(mockRes.cookie).toHaveBeenCalledWith('refreshToken', tokens.refreshToken, expect.any(Object));
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Token refreshed' });
        });
    });

    describe('logout', () => {
        it('should logout a user and clear cookies', async () => {
            (mockReq as any).user = { userId: '1' };
            vi.spyOn(authService, 'logout').mockResolvedValue(undefined);

            await authController.logout(mockReq as Request, mockRes as Response);

            expect(mockRes.status).toHaveBeenCalledWith(HttpStatus.NO_CONTENT);
            expect(mockRes.clearCookie).toHaveBeenCalledWith('accessToken');
            expect(mockRes.clearCookie).toHaveBeenCalledWith('refreshToken');
            expect(mockRes.send).toHaveBeenCalled();
        });
    });
});
