import { describe, it, expect } from 'vitest';
import { getRequiredParam, validateRequiredFields } from './params.js';
import { Request } from 'express';
import { MissingParamError, InvalidParamError, MissingFieldError } from './errors.js';

describe('Params Utility', () => {
    describe('getRequiredParam', () => {
        it('should return the parameter value if it exists', () => {
            const req = { params: { id: '123' } } as unknown as Request;
            expect(getRequiredParam(req, 'id')).toBe('123');
        });

        it('should throw MissingParamError if the parameter is missing', () => {
            const req = { params: {} } as unknown as Request;
            expect(() => getRequiredParam(req, 'id')).toThrow(MissingParamError);
        });
    });

    describe('validateRequiredFields', () => {
        it('should not throw if all fields are present', () => {
            const body = { email: 'test@example.com', passwordHash: 'hash' };
            expect(() => validateRequiredFields(body, ['email', 'passwordHash'])).not.toThrow();
        });

        it('should throw MissingFieldError if a field is missing', () => {
            const body = { email: 'test@example.com' };
            expect(() => validateRequiredFields(body, ['email', 'passwordHash'])).toThrow(MissingFieldError);
        });

        it('should throw MissingFieldError if a field is empty string', () => {
            const body = { email: 'test@example.com', passwordHash: '' };
            expect(() => validateRequiredFields(body, ['email', 'passwordHash'])).toThrow(MissingFieldError);
        });

        it('should throw InvalidParamError if body is missing', () => {
            expect(() => validateRequiredFields(null, ['email'])).toThrow(InvalidParamError);
        });
    });
});
