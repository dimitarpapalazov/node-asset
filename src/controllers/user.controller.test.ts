import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as userController from './user.controller.js';
import * as userService from '../services/user.service.js';
import { Request, Response, NextFunction } from 'express';
import { HttpStatus } from '../constants/constants.js';
import { ForbiddenError, NotFoundError } from '../utils/errors.js';
import { logger } from '../services/logger/logger.factory.js';
import { LogLevel } from '../services/logger/index.js';

vi.mock('../services/user.service.js', () => ({
    getUserById: vi.fn(),
    deleteUser: vi.fn(),
}));

vi.mock('../services/logger/logger.factory.js', () => ({
    logger: {
        log: vi.fn(),
    },
}));

describe('User Controller', () => {
    let mockRequest: any;
    let mockResponse: Partial<Response>;
    let nextSpy: NextFunction;
    let jsonSpy: any;
    let statusSpy: any;
    let sendSpy: any;

    beforeEach(() => {
        vi.clearAllMocks();

        jsonSpy = vi.fn();
        sendSpy = vi.fn();
        statusSpy = vi.fn(() => ({
            json: jsonSpy,
            send: sendSpy,
        }));

        mockResponse = {
            status: statusSpy,
        };
        nextSpy = vi.fn();
        mockRequest = {
            params: {},
            validData: {
                params: {},
            },
            traceId: 'test-trace-id',
        };
    });

    describe('getUser', () => {
        const validId = '123e4567-e89b-12d3-a456-426614174000';

        it('should throw NotFoundError if user not found', async () => {
            mockRequest.validData.params = { id: validId };
            (userService.getUserById as any).mockResolvedValue(undefined);

            await expect(userController.getUser(mockRequest as Request, mockResponse as Response))
                .rejects.toThrow(NotFoundError);
        });

        it('should return 200 and user if found', async () => {
            const mockUser = { id: validId, email: 'test@example.com' };
            mockRequest.validData.params = { id: validId };
            (userService.getUserById as any).mockResolvedValue(mockUser);

            await userController.getUser(mockRequest as Request, mockResponse as Response);

            expect(statusSpy).toHaveBeenCalledWith(HttpStatus.OK);
            expect(jsonSpy).toHaveBeenCalledWith(mockUser);
        });
    });

    describe('deleteUser', () => {
        const validId = '123e4567-e89b-12d3-a456-426614174000';

        it('should return 204 and log info on successful deletion', async () => {
            mockRequest.validData.params = { id: validId };
            mockRequest.user = { userId: validId };
            (userService.deleteUser as any).mockResolvedValue(undefined);

            await userController.deleteUser(mockRequest as Request, mockResponse as Response);

            expect(statusSpy).toHaveBeenCalledWith(HttpStatus.NO_CONTENT);
            expect(sendSpy).toHaveBeenCalled();
            expect(logger.log).toHaveBeenCalledWith(expect.objectContaining({
                level: LogLevel.INFO,
                message: expect.stringContaining(`User deleted: ${validId}`),
            }));
        });

        it('should throw ForbiddenError when deleting a different user', async () => {
            const otherId = '00000000-0000-0000-0000-000000000000';
            mockRequest.validData.params = { id: otherId };
            mockRequest.user = { userId: validId };

            await expect(userController.deleteUser(mockRequest as Request, mockResponse as Response))
                .rejects.toThrow(ForbiddenError);
        });
    });
});
