import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as userController from './user.controller.js';
import * as userService from '../services/user.service.js';
import { Request, Response } from 'express';
import { HttpStatus } from '../constants/constants.js';
import { MissingParamError, MissingFieldError } from '../utils/errors.js';
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
    });

    describe('getUser', () => {
        it('should return 404 and log a warning if user not found', async () => {
            mockRequest = { params: { id: '1' }, traceId: 'test-trace' };
            (userService.getUserById as any).mockResolvedValue(undefined);

            await userController.getUser(mockRequest as Request, mockResponse as Response);

            expect(statusSpy).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
            expect(jsonSpy).toHaveBeenCalledWith({ message: 'User not found' });
            expect(logger.log).toHaveBeenCalledWith(expect.objectContaining({
                level: LogLevel.WARN,
                message: expect.stringContaining('User not found: 1'),
            }));
        });

        it('should return 200 and user if found', async () => {
            const mockUser = { id: '1', email: 'test@example.com' };
            mockRequest = { params: { id: '1' } };
            (userService.getUserById as any).mockResolvedValue(mockUser);

            await userController.getUser(mockRequest as Request, mockResponse as Response);

            expect(statusSpy).toHaveBeenCalledWith(HttpStatus.OK);
            expect(jsonSpy).toHaveBeenCalledWith(mockUser);
        });

        it('should return 400 and log an error if required param is missing', async () => {
            mockRequest = { params: {}, traceId: 'test-trace' };

            await userController.getUser(mockRequest as Request, mockResponse as Response);

            expect(statusSpy).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
            expect(logger.log).toHaveBeenCalledWith(expect.objectContaining({
                level: LogLevel.ERROR,
            }));
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

        it('should return 403 when deleting a different user', async () => {
            mockRequest = { params: { id: '2' }, user: { userId: '1' }, traceId: 'test-trace' };

            await userController.deleteUser(mockRequest as Request, mockResponse as Response);

            expect(statusSpy).toHaveBeenCalledWith(HttpStatus.FORBIDDEN);
            expect(logger.log).toHaveBeenCalledWith(expect.objectContaining({
                level: LogLevel.ERROR,
            }));
        });
    });
});
