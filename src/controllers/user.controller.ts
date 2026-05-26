import { Request, Response } from 'express';
import * as userService from '../services/user.service.js';
import { HttpStatus } from '../constants/constants.js';
import { getRequiredParam } from '../utils/params.js';
import { AppError, ForbiddenError } from '../utils/errors.js';
import { logger } from '../services/logger/logger.factory.js';
import { LogLevel } from '../services/logger/index.js';
import { config } from '../config/config.js';


export const getUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = getRequiredParam(req, 'id');
        const user = await userService.getUserById(id);

        if (!user) {
            logger.log({
                timestamp: new Date().toISOString(),
                level: LogLevel.WARN,
                message: `User not found: ${id}`,
                traceId: req.traceId,
                environment: config.env,
            });

            res.status(HttpStatus.NOT_FOUND).json({ message: 'User not found' });
            return;
        }

        res.status(HttpStatus.OK).json(user);
    } catch (error) {
        handleError(req, res, error, 'Error retrieving user');
    }
};

export const deleteUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = getRequiredParam(req, 'id');
        const authenticatedUserId = req.user?.userId;

        if (authenticatedUserId !== id) {
            throw new ForbiddenError('You are not authorized to delete this user.');
        }

        await userService.deleteUser(id);

        logger.log({
            timestamp: new Date().toISOString(),
            level: LogLevel.INFO,
            message: `User deleted: ${id}`,
            userId: authenticatedUserId,
            traceId: req.traceId,
            environment: config.env,
        });

        res.status(HttpStatus.NO_CONTENT).send();
    } catch (error) {
        handleError(req, res, error, 'Error deleting user');
    }
};

/**
 * Common error handler for user controller.
 */
function handleError(req: Request, res: Response, error: unknown, fallbackMessage: string): void {
    const message = error instanceof Error ? error.message : fallbackMessage;
    const statusCode = error instanceof AppError ? error.statusCode : HttpStatus.INTERNAL_SERVER_ERROR;

    logger.log({
        timestamp: new Date().toISOString(),
        level: LogLevel.ERROR,
        message: `${fallbackMessage}: ${message}`,
        userId: req.user?.userId,
        traceId: req.traceId,
        environment: config.env,
        error: error instanceof Error ? error.stack : error,
    });

    res.status(statusCode).json({ message });
}
