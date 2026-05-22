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
        url: `postgresql://${dbUser}:${dbPass}@${dbHost}:${dbPort}/${dbName}`,
    },
};

/**
 * Retrieves an environment variable or throws an error if it is not defined.
 * 
 * @param key - The name of the environment variable.
 * @returns The value of the environment variable.
 * @throws Error if the environment variable is missing.
 */
function envOrThrow(key: string): string {
    const value = process.env[key];

    if (value === undefined || value === '') {
        throw new Error(`Environment variable ${key} is missing or empty.`);
    }

    return value;
}
