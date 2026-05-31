import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as userController from './user.controller.js';
import * as userService from '../services/user.service.js';
import { Request, Response, NextFunction } from 'express';
import { HttpStatus } from '../constants/constants.js';
import { MissingParamError, ForbiddenError, NotFoundError } from '../utils/errors.js';
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
    let mockRequest: Partial<Request>;
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
    });

    describe('getUser', () => {
        it('should throw NotFoundError if user not found', async () => {
            mockRequest = { params: { id: '1' }, traceId: 'test-trace' };
            (userService.getUserById as any).mockResolvedValue(undefined);

            await expect(userController.getUser(mockRequest as Request, mockResponse as Response))
                .rejects.toThrow(NotFoundError);
        });

        it('should return 200 and user if found', async () => {
            const mockUser = { id: '1', email: 'test@example.com' };
            mockRequest = { params: { id: '1' } };
            (userService.getUserById as any).mockResolvedValue(mockUser);

            await userController.getUser(mockRequest as Request, mockResponse as Response);

            expect(statusSpy).toHaveBeenCalledWith(HttpStatus.OK);
            expect(jsonSpy).toHaveBeenCalledWith(mockUser);
        });

        it('should throw MissingParamError if required param is missing', async () => {
            mockRequest = { params: {}, traceId: 'test-trace' };

            await expect(userController.getUser(mockRequest as Request, mockResponse as Response))
                .rejects.toThrow(MissingParamError);
        });
    });

    describe('deleteUser', () => {
        it('should return 204 and log info on successful deletion', async () => {
            mockRequest = { params: { id: '1' }, user: { userId: '1' }, traceId: 'test-trace' };
            (userService.deleteUser as any).mockResolvedValue(undefined);

            await userController.deleteUser(mockRequest as Request, mockResponse as Response);

            expect(statusSpy).toHaveBeenCalledWith(HttpStatus.NO_CONTENT);
            expect(sendSpy).toHaveBeenCalled();
            expect(logger.log).toHaveBeenCalledWith(expect.objectContaining({
                level: LogLevel.INFO,
                message: expect.stringContaining('User deleted: 1'),
            }));
        });

        it('should throw ForbiddenError when deleting a different user', async () => {
            mockRequest = { params: { id: '2' }, user: { userId: '1' }, traceId: 'test-trace' };

            await expect(userController.deleteUser(mockRequest as Request, mockResponse as Response))
                .rejects.toThrow(ForbiddenError);
        });
    });
});
