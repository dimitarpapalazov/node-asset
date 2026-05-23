import { envOrThrow } from "../utils/env.js";

/**
 * Configuration module.
 * Centralizes environment variable access and validation.
 */

/**
 * Application configuration interface.
 */
export interface Config {
    /**
     * The port the server should listen on.
     */
    port: number;

    /**
     * Database configuration.
     */
    db: {
        host: string;
        port: number;
        user: string;
        pass: string;
        name: string;
        url: string;
        drizzleConfigUrl: string;
    };

    /**
     * JWT configuration.
     */
    jwt: {
        accessSecret: string;
        refreshSecret: string;
        accessExpiry: string;
        refreshExpiry: string;
    };
}

const dbUser = envOrThrow('DB_USER');
const dbPass = envOrThrow('DB_PASSWORD');
const dbHost = envOrThrow('DB_HOST');
const dbPort = envOrThrow('DB_PORT');
const dbName = envOrThrow('DB_NAME');

/**
 * Global configuration object.
 */
export const config: Config = {
    port: parseInt(envOrThrow('PORT'), 10),
    db: {
        host: dbHost,
        port: parseInt(dbPort, 10),
        user: dbUser,
        pass: dbPass,
        name: dbName,
        url: `postgres://${dbUser}:${dbPass}@${dbHost}:${dbPort}/${dbName}`,
        drizzleConfigUrl: `postgres://${dbUser}:${dbPass}@localhost:${dbPort}/${dbName}`,
    },
    jwt: {
        accessSecret: envOrThrow('JWT_ACCESS_SECRET'),
        refreshSecret: envOrThrow('JWT_REFRESH_SECRET'),
        accessExpiry: envOrThrow('ACCESS_TOKEN_EXPIRY'),
        refreshExpiry: envOrThrow('REFRESH_TOKEN_EXPIRY'),
    },
};
