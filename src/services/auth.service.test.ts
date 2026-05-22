import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as authService from './auth.service.js';
import * as userService from './user.service.js';
import { db } from '../db/index.js';
import * as argon2 from 'argon2';
import jwt from 'jsonwebtoken';

vi.mock('./user.service.js');
vi.mock('../db/index.js', () => ({
    db: {
        select: vi.fn(() => ({
            from: vi.fn(() => ({
                where: vi.fn(() => Promise.resolve([{ id: '1', passwordHash: 'hashed', tokenVersion: 'v1' }])),
            })),
        })),
        update: vi.fn(() => ({
            set: vi.fn(() => ({
                where: vi.fn(() => Promise.resolve()),
            })),
        })),
    },
}));
vi.mock('argon2');
vi.mock('jsonwebtoken');
vi.mock('../config/config.js', () => ({
    config: {
        jwt: {
            accessSecret: 'access',
            refreshSecret: 'refresh',
            accessExpiry: '1m',
            refreshExpiry: '1m'
        }
    }
}));

describe('Auth Service', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should login successfully', async () => {
        (userService.getUserByEmail as any).mockResolvedValue({ id: '1' });
        (argon2.verify as any).mockResolvedValue(true);
        (jwt.sign as any).mockReturnValue('token');

        const tokens = await authService.login('test@example.com', 'password');

        expect(tokens).toEqual({ accessToken: 'token', refreshToken: 'token' });
    });

    it('should logout successfully', async () => {
        await authService.logout('1');
        expect(db.update).toHaveBeenCalled();
    });
});
