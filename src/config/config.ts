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
}

/**
 * Global configuration object.
 */
export const config: Config = {
    port: parseInt(envOrThrow('PORT'), 10),
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
