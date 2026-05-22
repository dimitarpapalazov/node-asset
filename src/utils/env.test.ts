import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { envOrThrow } from './env.js';

describe('Environment Utility', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        process.env = { ...originalEnv };
    });

    afterEach(() => {
        process.env = originalEnv;
    });

    describe('envOrThrow', () => {
        it('should return the value if the environment variable exists', () => {
            process.env.TEST_VAR = 'test-value';
            expect(envOrThrow('TEST_VAR')).toBe('test-value');
        });

        it('should throw an error if the environment variable is missing', () => {
            delete process.env.MISSING_VAR;
            expect(() => envOrThrow('MISSING_VAR')).toThrow('Environment variable MISSING_VAR is missing or empty.');
        });

        it('should throw an error if the environment variable is an empty string', () => {
            process.env.EMPTY_VAR = '';
            expect(() => envOrThrow('EMPTY_VAR')).toThrow('Environment variable EMPTY_VAR is missing or empty.');
        });
    });
});
