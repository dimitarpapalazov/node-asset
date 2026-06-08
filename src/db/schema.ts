import { pgTable, uuid, varchar, timestamp, text, integer, jsonb } from 'drizzle-orm/pg-core';
import { ExportStatus } from '../constants/constants.js';

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

export const assets = pgTable('assets', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 255 }).notNull(),

    // Relations
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    projectId: uuid('project_id').references(() => projects.id, { onDelete: 'cascade' }).notNull(),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const assetKeys = pgTable('asset_keys', {
    id: uuid('id').primaryKey().defaultRandom(),
    key: varchar('key', { length: 255 }).notNull().unique(),
    
    assetId: uuid('asset_id').references(() => assets.id, { onDelete: 'cascade' }).notNull(),
    
    // If null, the key never expires
    expiresAt: timestamp('expires_at'),
    
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const exportJobs = pgTable('export_jobs', {
    id: uuid('id').primaryKey().defaultRandom(),
    projectId: uuid('project_id').references(() => projects.id, { onDelete: 'cascade' }).notNull(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    
    status: varchar('status', { length: 20 }).$type<ExportStatus>().default(ExportStatus.PENDING).notNull(),
    
    // CAS hash of the resulting zip file
    zipHash: varchar('zip_hash', { length: 64 }),
    
    error: text('error'),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const assetVersions = pgTable('asset_versions', {
    id: uuid('id').primaryKey().defaultRandom(),
    assetId: uuid('asset_id').references(() => assets.id, { onDelete: 'cascade' }).notNull(),

    // Content-Addressable Storage hash
    hash: varchar('hash', { length: 64 }).notNull(),

    // Metadata
    size: integer('size').notNull(),
    format: varchar('format', { length: 50 }).notNull(),
    width: integer('width'),
    height: integer('height'),

    // Parameters used for this manipulation (optional)
    params: jsonb('params'),

    createdAt: timestamp('created_at').defaultNow().notNull(),
});
