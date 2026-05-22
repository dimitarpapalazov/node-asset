import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as userService from './user.service.js';
import { db } from '../db/index.js';

// Mock the db object
vi.mock('../db/index.js', () => ({
    db: {
        insert: vi.fn(() => ({
            values: vi.fn(() => ({
                returning: vi.fn(() => [{ id: '1', email: 'test@example.com' }]),
            })),
        })),
        select: vi.fn(() => ({
            from: vi.fn(() => ({
                where: vi.fn(() => [{ id: '1', email: 'test@example.com' }]),
            })),
        })),
        delete: vi.fn(() => ({
            where: vi.fn(() => Promise.resolve()),
        })),
    },
}));

describe('User Service', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should create a user', async () => {
        const input = { email: 'test@example.com', passwordHash: 'hash' };
        const user = await userService.createUser(input);

        expect(db.insert).toHaveBeenCalled();
        expect(user).toHaveProperty('email', 'test@example.com');
    });

    it('should get a user by id', async () => {
        const user = await userService.getUserById('1');

        expect(db.select).toHaveBeenCalled();
        expect(user).toHaveProperty('id', '1');
    });

    it('should get a user by email', async () => {
        const user = await userService.getUserByEmail('test@example.com');

        expect(db.select).toHaveBeenCalled();
        expect(user).toHaveProperty('email', 'test@example.com');
    });

    it('should delete a user', async () => {
        await userService.deleteUser('1');
        expect(db.delete).toHaveBeenCalled();
    });
});
