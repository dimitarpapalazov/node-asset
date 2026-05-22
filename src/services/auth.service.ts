import jwt from 'jsonwebtoken';
import * as argon2 from 'argon2';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { config } from '../config/config.js';
import * as userService from './user.service.js';
import { UnauthorizedError } from '../utils/errors.js';

export const login = async (email: string, password: string) => {
    const user = await userService.getUserByEmail(email);

    if (!user) {
        throw new UnauthorizedError('Invalid credentials.');
    }

    const fullUser = await db.select().from(users).where(eq(users.id, user.id)).then(res => res[0]);
    
    if (!fullUser || !(await argon2.verify(fullUser.passwordHash, password))) {
        throw new UnauthorizedError('Invalid credentials.');
    }

    return generateTokens(fullUser.id, fullUser.tokenVersion);
};

export const refresh = async (refreshToken: string) => {
    try {
        const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret) as { userId: string, version: string };
        const user = await db.select().from(users).where(eq(users.id, decoded.userId)).then(res => res[0]);

        if (!user || user.tokenVersion !== decoded.version) {
            throw new UnauthorizedError('Invalid refresh token.');
        }

        return generateTokens(user.id, user.tokenVersion);
    } catch {
        throw new UnauthorizedError('Invalid refresh token.');
    }
};

export const logout = async (userId: string) => {
    await db.update(users)
        .set({ tokenVersion: crypto.randomUUID() })
        .where(eq(users.id, userId));
};

function generateTokens(userId: string, version: string) {
    const accessToken = jwt.sign({ userId }, config.jwt.accessSecret as jwt.Secret, { expiresIn: config.jwt.accessExpiry } as jwt.SignOptions);
    const refreshToken = jwt.sign({ userId, version }, config.jwt.refreshSecret as jwt.Secret, { expiresIn: config.jwt.refreshExpiry } as jwt.SignOptions);
    return { accessToken, refreshToken };
}
