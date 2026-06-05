import { Request, Response } from 'express';
import * as userService from '../services/user.service.js';
import { HttpStatus } from '../constants/constants.js';
import { ForbiddenError, NotFoundError } from '../utils/errors.js';
import { logger } from '../services/logger/logger.factory.js';
import { LogLevel } from '../services/logger/index.js';
import { config } from '../config/config.js';

export const getUser = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.validData.params;

    const user = await userService.getUserById(id);

    if (!user) {
        throw new NotFoundError(`User with ID ${id} not found`);
    }

    res.status(HttpStatus.OK).json(user);
};

export const deleteUser = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.validData.params;
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
};

