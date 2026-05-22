import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import * as argon2 from 'argon2';

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
    const passwordHash = await argon2.hash(input.password);

    const [user] = await db.insert(users)
        .values({
            email: input.email,
            passwordHash,
        })
        .returning();

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
};

/**
 * Maps a database user to a response user.
 */
function toUserResponse(user: User): UserResponse {
    const { passwordHash, ...response } = user;
    return response;
}
