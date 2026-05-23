import { pgTable, uuid, varchar, timestamp, text } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
    id: uuid('id').primaryKey().defaultRandom(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    
    // Argon2 password hash
    passwordHash: text('password_hash').notNull(),

    // Used for refresh token rotation/invalidation
    tokenVersion: uuid('token_version').defaultRandom().notNull(),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const projects = pgTable('projects', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 255 }).notNull(),
    
    // Ownership
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
