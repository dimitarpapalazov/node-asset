import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as userService from './user.service.js';
import { db } from '../db/index.js';
import * as argon2 from 'argon2';

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
                where: vi.fn(() => [{ id: '1', email: 'test@example.com', passwordHash: 'hashed' }]),
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

describe('User Service', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should create a user', async () => {
        const input = { email: 'test@example.com', password: 'password' };
        const user = await userService.createUser(input);

        expect(argon2.hash).toHaveBeenCalledWith('password');
        expect(db.insert).toHaveBeenCalled();
        expect(user).toHaveProperty('email', 'test@example.com');
        expect(user).not.toHaveProperty('passwordHash');
    });

    it('should get a user by id', async () => {
        const user = await userService.getUserById('1');

        expect(db.select).toHaveBeenCalled();
        expect(user).toHaveProperty('id', '1');
        expect(user).not.toHaveProperty('passwordHash');
    });

    it('should get a user by email', async () => {
        const user = await userService.getUserByEmail('test@example.com');

        expect(db.select).toHaveBeenCalled();
        expect(user).toHaveProperty('email', 'test@example.com');
        expect(user).not.toHaveProperty('passwordHash');
    });

    it('should delete a user', async () => {
        await userService.deleteUser('1');
        expect(db.delete).toHaveBeenCalled();
    });
});
