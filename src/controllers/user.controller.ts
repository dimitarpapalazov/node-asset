import { Request, Response } from 'express';
import * as userService from '../services/user.service.js';
import { HttpStatus } from '../constants/constants.js';
import { getRequiredParam, validateRequiredFields } from '../utils/params.js';
import { AppError, ForbiddenError } from '../utils/errors.js';

export const getUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = getRequiredParam(req, 'id');
        const user = await userService.getUserById(id);

        if (!user) {
            res.status(HttpStatus.NOT_FOUND).json({ message: 'User not found' });
            return;
        }

        res.status(HttpStatus.OK).json(user);
    } catch (error) {
        handleError(res, error, 'Error retrieving user');
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
        res.status(HttpStatus.NO_CONTENT).send();
    } catch (error) {
        handleError(res, error, 'Error deleting user');
    }
};

/**
 * Common error handler for user controller.
 */
function handleError(res: Response, error: unknown, fallbackMessage: string): void {
    if (error instanceof AppError) {
        res.status(error.statusCode).json({ message: error.message });
        return;
    }

    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: error instanceof Error ? error.message : fallbackMessage
    });
}
