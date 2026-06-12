import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as projectController from './project.controller.js';
import * as projectService from '../services/project.service.js';
import { HttpStatus } from '../constants/constants.js';
import { logger } from '../services/logger/logger.factory.js';
import { NotFoundError, InvalidParamError } from '../utils/errors.js';

vi.mock('../services/project.service.js', () => ({
    createProject: vi.fn(),
    getUserProjects: vi.fn(),
    getProjectByIdAndUserId: vi.fn(),
    updateProject: vi.fn(),
    deleteProject: vi.fn(),
    exportProject: vi.fn(),
    importProject: vi.fn(),
}));

vi.mock('../services/logger/logger.factory.js', () => ({
    logger: {
        log: vi.fn(),
    },
}));

describe('Project Controller', () => {
    let req: any;
    let res: any;

    beforeEach(() => {
        vi.clearAllMocks();
        req = {
            params: {},
            body: {},
            validData: {
                params: {},
                body: {},
            },
            user: { userId: 'user-1' },
            traceId: 'test-trace-id',
        };
        res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn().mockReturnThis(),
            send: vi.fn().mockReturnThis(),
            setHeader: vi.fn(),
        };
    });

    describe('createProject', () => {
        it('should create project and log success', async () => {
            req.validData.body = { name: 'New Project' };
            const mockProject = { id: 'p1', name: 'New Project', userId: 'user-1' };
            vi.mocked(projectService.createProject).mockResolvedValue(mockProject);

            await projectController.createProject(req, res);

            expect(projectService.createProject).toHaveBeenCalledWith({ name: 'New Project', userId: 'user-1' });
            expect(res.status).toHaveBeenCalledWith(HttpStatus.CREATED);
            expect(logger.log).toHaveBeenCalledWith(expect.objectContaining({
                message: 'Project created: p1',
                userId: 'user-1',
            }));
        });
    });

    describe('getProject', () => {
        const validId = '123e4567-e89b-12d3-a456-426614174001';

        it('should return project if authorized', async () => {
            req.validData.params = { id: validId };
            const mockProject = { id: validId, name: 'Test Project', userId: 'user-1' };
            vi.mocked(projectService.getProjectByIdAndUserId).mockResolvedValue(mockProject);

            await projectController.getProject(req, res);

            expect(projectService.getProjectByIdAndUserId).toHaveBeenCalledWith(validId, 'user-1');
            expect(res.status).toHaveBeenCalledWith(HttpStatus.OK);
            expect(res.json).toHaveBeenCalledWith(mockProject);
        });

        it('should throw NotFoundError if unauthorized', async () => {
            req.validData.params = { id: validId };
            vi.mocked(projectService.getProjectByIdAndUserId).mockResolvedValue(undefined);

            await expect(projectController.getProject(req, res))
                .rejects.toThrow(NotFoundError);
        });
    });

    describe('exportProject', () => {
        const validId = '123e4567-e89b-12d3-a456-426614174001';

        it('should set headers, pipe archive, and log start', async () => {
            req.validData.params = { id: validId };
            const mockArchive = {
                pipe: vi.fn(),
                on: vi.fn(),
            };
            vi.mocked(projectService.exportProject).mockResolvedValue({
                archive: mockArchive as any,
                projectName: 'Test Project'
            });

            await projectController.exportProject(req, res);

            expect(projectService.exportProject).toHaveBeenCalledWith(validId, 'user-1');
            expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'application/zip');
            expect(mockArchive.pipe).toHaveBeenCalledWith(res);
            expect(logger.log).toHaveBeenCalledWith(expect.objectContaining({
                message: `Project export started: ${validId}`,
            }));
        });

        it('should throw error when export service fails', async () => {
            req.validData.params = { id: validId };
            vi.mocked(projectService.exportProject).mockRejectedValue(new Error('Project not found'));

            await expect(projectController.exportProject(req, res))
                .rejects.toThrow('Project not found');
        });
    });

    describe('importProject', () => {
        it('should import a project and return 201', async () => {
            req.file = { buffer: Buffer.from('zip-data') };
            const mockResult = {
                project: { id: 'new-p1', name: 'Imported Project' },
                assets: [{ id: 'new-a1', name: 'image', latestVersion: { id: 'new-v1' } }],
            };
            vi.mocked(projectService.importProject).mockResolvedValue(mockResult as any);

            await projectController.importProject(req, res);

            expect(projectService.importProject).toHaveBeenCalledWith('user-1', Buffer.from('zip-data'));
            expect(res.status).toHaveBeenCalledWith(HttpStatus.CREATED);
            expect(res.json).toHaveBeenCalledWith(mockResult);
            expect(logger.log).toHaveBeenCalledWith(expect.objectContaining({
                message: 'Project imported: new-p1 with 1 assets',
            }));
        });

        it('should throw InvalidParamError when file is missing', async () => {
            req.file = undefined;

            await expect(projectController.importProject(req, res))
                .rejects.toThrow(InvalidParamError);
        });
    });
});
