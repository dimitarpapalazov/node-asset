import { HttpStatus } from '../constants/constants.js';

export class AppError extends Error {
    constructor(public message: string, public statusCode: number = HttpStatus.INTERNAL_SERVER_ERROR) {
        super(message);
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}

export class MissingParamError extends AppError {
    constructor(paramName: string) {
        super(`Required parameter "${paramName}" is missing.`, HttpStatus.BAD_REQUEST);
    }
}

export class MissingFieldError extends AppError {
    constructor(fieldName: string) {
        super(`Required field "${fieldName}" is missing from request body.`, HttpStatus.BAD_REQUEST);
    }
}

export class InvalidParamError extends AppError {
    constructor(message: string) {
        super(message, HttpStatus.BAD_REQUEST);
    }
}

export class UnauthorizedError extends AppError {
    constructor(message: string = 'Unauthorized access.') {
        super(message, HttpStatus.UNAUTHORIZED);
    }
}

export class ConflictError extends AppError {
    constructor(message: string) {
        super(message, HttpStatus.CONFLICT);
    }
}
