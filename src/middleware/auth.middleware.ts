import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/config.js';
import { UnauthorizedError } from '../utils/errors.js';

export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
    const token = req.cookies.accessToken;

    if (!token) {
        throw new UnauthorizedError('Missing or invalid token.');
    }

    try {
        const decoded = jwt.verify(token, config.jwt.accessSecret) as { userId: string };
        req.user = decoded;
        next();
    } catch (error) {
        throw new UnauthorizedError('Invalid or expired token.');
    }
};
