import { Request, Response } from 'express';
import * as authService from '../services/auth.service.js';
import * as userService from '../services/user.service.js';
import { HttpStatus } from '../constants/constants.js';
import { validateRequiredFields } from '../utils/params.js';
import { AppError } from '../utils/errors.js';
import { config } from '../config/config.js';
import { logger } from '../services/logger/logger.factory.js';
import { LogLevel } from '../services/logger/index.js';

const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
};

const parseDurationToMs = (duration: string): number => {
    const value = parseInt(duration, 10);
    const unit = duration.slice(-1);

    switch (unit) {
        case 's': return value * 1000;
        case 'm': return value * 60 * 1000;
        case 'h': return value * 60 * 60 * 1000;
        case 'd': return value * 24 * 60 * 60 * 1000;
        default: return value;
    }
};

const setTokenCookies = (res: Response, tokens: { accessToken: string, refreshToken: string }) => {
    res.cookie('accessToken', tokens.accessToken, { 
        ...cookieOptions, 
        maxAge: parseDurationToMs(config.jwt.accessExpiry) 
    });
    res.cookie('refreshToken', tokens.refreshToken, { 
        ...cookieOptions, 
        maxAge: parseDurationToMs(config.jwt.refreshExpiry) 
    });
};

export const register = async (req: Request, res: Response): Promise<void> => {
    try {
        validateRequiredFields(req.body, ['email', 'password']);

        const user = await userService.createUser(req.body);
        const tokens = await authService.login(req.body.email, req.body.password);
        setTokenCookies(res, tokens);

        logger.log({
            timestamp: new Date().toISOString(),
            level: LogLevel.INFO,
            message: 'User registered successfully',
            userId: user.id,
            ipAddress: req.ip,
            environment: config.env,
            traceId: req.traceId,
            email: req.body.email,
        });

        res.status(HttpStatus.CREATED).json({ user });
    } catch (error) {
        handleError(req, res, error, 'Error registering user');
    }
};

export const login = async (req: Request, res: Response): Promise<void> => {
    const { email } = req.body;

    try {
        validateRequiredFields(req.body, ['email', 'password']);

        const tokens = await authService.login(email, req.body.password);
        setTokenCookies(res, tokens);

        logger.log({
            timestamp: new Date().toISOString(),
            level: LogLevel.INFO,
            message: 'User logged in successfully',
            ipAddress: req.ip,
            environment: config.env,
            traceId: req.traceId,
            email,
        });

        res.status(HttpStatus.OK).json({ message: 'Logged in successfully' });
    } catch (error) {
        handleError(req, res, error, 'Error logging in', { email });
    }
};

export const refresh = async (req: Request, res: Response): Promise<void> => {
    try {
        const refreshToken = req.cookies.refreshToken;

        if (!refreshToken) {
            throw new AppError('Refresh token missing', HttpStatus.UNAUTHORIZED);
        }

        const tokens = await authService.refresh(refreshToken);
        setTokenCookies(res, tokens);

        logger.log({
            timestamp: new Date().toISOString(),
            level: LogLevel.INFO,
            message: 'Token refreshed successfully',
            ipAddress: req.ip,
            environment: config.env,
            traceId: req.traceId,
        });

        res.status(HttpStatus.OK).json({ message: 'Token refreshed' });
    } catch (error) {
        handleError(req, res, error, 'Error refreshing token');
    }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            throw new AppError('Unauthorized', HttpStatus.UNAUTHORIZED);
        }

        await authService.logout(userId);
        res.clearCookie('accessToken');
        res.clearCookie('refreshToken');

        logger.log({
            timestamp: new Date().toISOString(),
            level: LogLevel.INFO,
            message: 'User logged out successfully',
            userId,
            ipAddress: req.ip,
            environment: config.env,
            traceId: req.traceId,
        });

        res.status(HttpStatus.NO_CONTENT).send();
    } catch (error) {
        handleError(req, res, error, 'Error logging out');
    }
};

/**
 * Common error handler for auth controller.
 */
function handleError(req: Request, res: Response, error: unknown, fallbackMessage: string, context?: Record<string, any>): void {
    const statusCode = error instanceof AppError ? error.statusCode : HttpStatus.INTERNAL_SERVER_ERROR;
    const message = error instanceof Error ? error.message : fallbackMessage;

    logger.log({
        timestamp: new Date().toISOString(),
        level: statusCode >= 500 ? LogLevel.ERROR : LogLevel.WARN,
        message,
        ipAddress: req.ip,
        environment: config.env,
        traceId: req.traceId,
        userId: req.user?.userId,
        ...context,
        error: error instanceof Error ? {
            message: error.message,
            stack: error.stack,
        } : error,
    });

    res.status(statusCode).json({ message });
}
