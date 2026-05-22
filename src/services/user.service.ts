import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { eq } from 'drizzle-orm';

export interface CreateUserInput {
    email: string;
    passwordHash: string;
}

export type User = typeof users.$inferSelect;

export const createUser = async (input: CreateUserInput): Promise<User> => {
    const [user] = await db.insert(users)
        .values({
            email: input.email,
            passwordHash: input.passwordHash,
        })
        .returning();

    return user;
};

export const getUserById = async (id: string): Promise<User | undefined> => {
    const [user] = await db.select()
        .from(users)
        .where(eq(users.id, id));

    return user;
};

export const getUserByEmail = async (email: string): Promise<User | undefined> => {
    const [user] = await db.select()
        .from(users)
        .where(eq(users.email, email));

    return user;
};

export const deleteUser = async (id: string): Promise<void> => {
    await db.delete(users)
        .where(eq(users.id, id));
};
