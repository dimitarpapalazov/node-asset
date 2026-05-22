import { Request } from 'express';
import { MissingParamError, InvalidParamError, MissingFieldError } from './errors.js';

/**
 * Extracts a required parameter from the request or throws an error.
 */
export function getRequiredParam(req: Request, key: string): string {
    const value = req.params[key];

    if (value === undefined || value === '') {
        throw new MissingParamError(key);
    }

    if (Array.isArray(value)) {
        throw new InvalidParamError(`Parameter "${key}" cannot be an array.`);
    }

    return value;
}

/**
 * Validates that the provided object contains all required fields.
 * 
 * @param obj - The object to validate (usually req.body).
 * @param fields - An array of field names that are required.
 * @throws MissingFieldError if a field is missing or empty.
 */
export function validateRequiredFields(obj: any, fields: string[]): void {
    if (!obj) {
        throw new InvalidParamError('Request body is missing.');
    }

    for (const field of fields) {
        const value = obj[field];

        if (value === undefined || value === null || value === '') {
            throw new MissingFieldError(field);
        }
    }
}
