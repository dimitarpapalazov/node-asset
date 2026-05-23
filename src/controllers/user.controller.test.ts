import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as userController from './user.controller.js';
import * as userService from '../services/user.service.js';
import { Request, Response } from 'express';
import { HttpStatus } from '../constants/constants.js';
import { MissingParamError, MissingFieldError } from '../utils/errors.js';

vi.mock('../services/user.service.js', () => ({
    getUserById: vi.fn(),
    deleteUser: vi.fn(),
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
        it('should return 404 if user not found', async () => {
            mockRequest = { params: { id: '1' } };
            (userService.getUserById as any).mockResolvedValue(undefined);

            await userController.getUser(mockRequest as Request, mockResponse as Response);

            expect(statusSpy).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
            expect(jsonSpy).toHaveBeenCalledWith({ message: 'User not found' });
        });

        it('should return 200 and user if found', async () => {
            const mockUser = { id: '1', email: 'test@example.com' };
            mockRequest = { params: { id: '1' } };
            (userService.getUserById as any).mockResolvedValue(mockUser);

            await userController.getUser(mockRequest as Request, mockResponse as Response);

            expect(statusSpy).toHaveBeenCalledWith(HttpStatus.OK);
            expect(jsonSpy).toHaveBeenCalledWith(mockUser);
        });

        it('should return 400 if required param is missing', async () => {
            mockRequest = { params: {} };

            await userController.getUser(mockRequest as Request, mockResponse as Response);

            expect(statusSpy).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
            expect(jsonSpy).toHaveBeenCalledWith({
                message: new MissingParamError('id').message
            });
        });
    });

    describe('deleteUser', () => {
        it('should return 204 on successful deletion', async () => {
            mockRequest = { params: { id: '1' } };
            (userService.deleteUser as any).mockResolvedValue(undefined);

            await userController.deleteUser(mockRequest as Request, mockResponse as Response);

            expect(statusSpy).toHaveBeenCalledWith(HttpStatus.NO_CONTENT);
            expect(sendSpy).toHaveBeenCalled();
        });
    });
});
