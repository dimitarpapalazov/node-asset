import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import * as argon2 from 'argon2';
import { ConflictError } from '../utils/errors.js';
import { logger } from './logger/logger.factory.js';
import { LogLevel } from './logger/index.js';
import { config } from '../config/config.js';


export interface CreateUserInput {
    email: string;
    password: string;
}

export type User = typeof users.$inferSelect;

/**
 * User object as returned to the client (excluding sensitive fields).
 */
export type UserResponse = Omit<User, 'passwordHash'>;

export const createUser = async (input: CreateUserInput): Promise<UserResponse> => {
    const existingUser = await getUserByEmail(input.email);

    if (existingUser) {
        throw new ConflictError('User with this email already exists.');
    }

    const passwordHash = await argon2.hash(input.password);

    const [user] = await db.insert(users)
        .values({
            email: input.email,
            passwordHash,
        })
        .returning();

    logger.log({
        timestamp: new Date().toISOString(),
        level: LogLevel.INFO,
        message: `User created: ${user.id}`,
        environment: config.env,
        traceId: 'system',
    });

    return toUserResponse(user);
};

export const getUserById = async (id: string): Promise<UserResponse | undefined> => {
    const [user] = await db.select()
        .from(users)
        .where(eq(users.id, id));

    return user ? toUserResponse(user) : undefined;
};

export const getUserByEmail = async (email: string): Promise<UserResponse | undefined> => {
    const [user] = await db.select()
        .from(users)
        .where(eq(users.email, email));

    return user ? toUserResponse(user) : undefined;
};

export const deleteUser = async (id: string): Promise<void> => {
    await db.delete(users)
        .where(eq(users.id, id));

    logger.log({
        timestamp: new Date().toISOString(),
        level: LogLevel.INFO,
        message: `User record deleted from DB: ${id}`,
        environment: config.env,
        traceId: 'system',
    });
};

/**
 * Maps a database user to a response user.
 */
function toUserResponse(user: User): UserResponse {
    const { passwordHash, ...response } = user;
    return response;
}
