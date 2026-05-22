import { describe, it, expect } from 'vitest';
import { AppError, MissingParamError, InvalidParamError } from './errors.js';
import { HttpStatus } from '../constants/constants.js';

describe('Error Classes', () => {
    describe('AppError', () => {
        it('should create an instance with default status code', () => {
            const error = new AppError('test message');
            expect(error.message).toBe('test message');
            expect(error.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
            expect(error.name).toBe('AppError');
        });

        it('should create an instance with specific status code', () => {
            const error = new AppError('test message', HttpStatus.BAD_REQUEST);
            expect(error.statusCode).toBe(HttpStatus.BAD_REQUEST);
        });
    });

    describe('MissingParamError', () => {
        it('should create an instance with correct message and status code', () => {
            const error = new MissingParamError('id');
            expect(error.message).toBe('Required parameter "id" is missing.');
            expect(error.statusCode).toBe(HttpStatus.BAD_REQUEST);
        });
    });

    describe('InvalidParamError', () => {
        it('should create an instance with correct message and status code', () => {
            const error = new InvalidParamError('invalid');
            expect(error.message).toBe('invalid');
            expect(error.statusCode).toBe(HttpStatus.BAD_REQUEST);
        });
    });
});
