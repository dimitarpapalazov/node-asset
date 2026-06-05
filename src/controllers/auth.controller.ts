import { Request, Response } from 'express';
import * as authService from '../services/auth.service.js';
import * as userService from '../services/user.service.js';
import { HttpStatus } from '../constants/constants.js';
import { UnauthorizedError } from '../utils/errors.js';
import { config } from '../config/config.js';
import { logger } from '../services/logger/logger.factory.js';
import { LogLevel } from '../services/logger/index.js';
import { RegisterData, LoginData, RefreshData } from '../schemas/auth.schema.js';
import { ValidatedRequest } from '../types/validation.js';

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

export const register = async (req: ValidatedRequest<RegisterData>, res: Response): Promise<void> => {
    const { body } = req.validData;
    const user = await userService.createUser(body);
    const tokens = await authService.login(body.email, body.password);
    setTokenCookies(res, tokens);

    logger.log({
        timestamp: new Date().toISOString(),
        level: LogLevel.INFO,
        message: 'User registered successfully',
        userId: user.id,
        ipAddress: req.ip,
        environment: config.env,
        traceId: req.traceId,
        email: body.email,
    });

    res.status(HttpStatus.CREATED).json({ user });
};

export const login = async (req: ValidatedRequest<LoginData>, res: Response): Promise<void> => {
    const { body } = req.validData;
    const tokens = await authService.login(body.email, body.password);
    setTokenCookies(res, tokens);

    logger.log({
        timestamp: new Date().toISOString(),
        level: LogLevel.INFO,
        message: 'User logged in successfully',
        ipAddress: req.ip,
        environment: config.env,
        traceId: req.traceId,
        email: body.email,
    });

    res.status(HttpStatus.OK).json({ message: 'Logged in successfully' });
};

export const refresh = async (req: ValidatedRequest<RefreshData>, res: Response): Promise<void> => {
    const { cookies } = req.validData;
    const refreshToken = cookies.refreshToken;

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
};

export const logout = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.userId;

    if (!userId) {
        throw new UnauthorizedError();
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
};
