import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as userService from './user.service.js';
import { db } from '../db/index.js';
import * as argon2 from 'argon2';
import { logger } from './logger/logger.factory.js';
import { LogLevel } from './logger/index.js';

// Mock dependencies
vi.mock('../db/index.js', () => ({
    db: {
        insert: vi.fn(() => ({
            values: vi.fn(() => ({
                returning: vi.fn(() => [{ id: '1', email: 'test@example.com', passwordHash: 'hashed' }]),
            })),
        })),
        select: vi.fn(() => ({
            from: vi.fn(() => ({
                where: vi.fn(() => []), // Simulate no user found
            })),
        })),
        delete: vi.fn(() => ({
            where: vi.fn(() => Promise.resolve()),
        })),
    },
}));

vi.mock('argon2', () => ({
    hash: vi.fn().mockResolvedValue('hashed'),
}));

vi.mock('./logger/logger.factory.js', () => ({
    logger: {
        log: vi.fn(),
    },
}));

describe('User Service', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should create a user and log info', async () => {
        const input = { email: 'test@example.com', password: 'password' };
        const user = await userService.createUser(input);

        expect(argon2.hash).toHaveBeenCalledWith('password');
        expect(db.insert).toHaveBeenCalled();
        expect(user).toHaveProperty('email', 'test@example.com');
        expect(user).not.toHaveProperty('passwordHash');
        expect(logger.log).toHaveBeenCalledWith(expect.objectContaining({
            level: LogLevel.INFO,
            message: expect.stringContaining('User created: 1'),
        }));
    });

    // Need to handle different select mocks for different tests
    it('should get a user by id', async () => {
        // Redefine select mock to return a user for this specific test
        (db.select as any).mockReturnValue({
            from: vi.fn(() => ({
                where: vi.fn(() => [{ id: '1', email: 'test@example.com', passwordHash: 'hashed' }]),
            })),
        });
        const user = await userService.getUserById('1');

        expect(db.select).toHaveBeenCalled();
        expect(user).toHaveProperty('id', '1');
        expect(user).not.toHaveProperty('passwordHash');
    });

    it('should get a user by email', async () => {
        // Redefine select mock to return a user for this specific test
        (db.select as any).mockReturnValue({
            from: vi.fn(() => ({
                where: vi.fn(() => [{ id: '1', email: 'test@example.com', passwordHash: 'hashed' }]),
            })),
        });
        const user = await userService.getUserByEmail('test@example.com');

        expect(db.select).toHaveBeenCalled();
        expect(user).toHaveProperty('email', 'test@example.com');
        expect(user).not.toHaveProperty('passwordHash');
    });

    it('should delete a user and log info', async () => {
        await userService.deleteUser('1');
        expect(db.delete).toHaveBeenCalled();
        expect(logger.log).toHaveBeenCalledWith(expect.objectContaining({
            level: LogLevel.INFO,
            message: expect.stringContaining('User record deleted from DB: 1'),
        }));
    });
});
