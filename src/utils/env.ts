/**
 * Retrieves an environment variable or throws an error if it is not defined.
 * 
 * @param key - The name of the environment variable.
 * @returns The value of the environment variable.
 * @throws Error if the environment variable is missing.
 */
export function envOrThrow(key: string): string {
    const value = process.env[key];

    if (value === undefined || value === '') {
        throw new Error(`Environment variable ${key} is missing or empty.`);
    }

    return value;
}
