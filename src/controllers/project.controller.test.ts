import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as projectController from './project.controller.js';
import * as projectService from '../services/project.service.js';
import { HttpStatus } from '../constants/constants.js';
import { logger } from '../services/logger/logger.factory.js';

vi.mock('../services/project.service.js', () => ({
    createProject: vi.fn(),
    getUserProjects: vi.fn(),
    getProjectByIdAndUserId: vi.fn(),
    updateProject: vi.fn(),
    deleteProject: vi.fn(),
    exportProject: vi.fn(),
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
            req.body = { name: 'New Project' };
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
        it('should return project if authorized', async () => {
            req.params = { id: 'p1' };
            const mockProject = { id: 'p1', name: 'Test Project', userId: 'user-1' };
            vi.mocked(projectService.getProjectByIdAndUserId).mockResolvedValue(mockProject);

            await projectController.getProject(req, res);

            expect(projectService.getProjectByIdAndUserId).toHaveBeenCalledWith('p1', 'user-1');
            expect(res.status).toHaveBeenCalledWith(HttpStatus.OK);
            expect(res.json).toHaveBeenCalledWith(mockProject);
        });

        it('should return 404 and log warning if unauthorized', async () => {
            req.params = { id: 'p1' };
            vi.mocked(projectService.getProjectByIdAndUserId).mockResolvedValue(undefined);

            await projectController.getProject(req, res);

            expect(res.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
            expect(logger.log).toHaveBeenCalledWith(expect.objectContaining({
                message: 'Project not found or unauthorized: p1',
                level: 'WARN',
            }));
        });
    });

    describe('exportProject', () => {
        it('should set headers, pipe archive, and log start', async () => {
            req.params = { id: 'p1' };
            const mockArchive = {
                pipe: vi.fn(),
                on: vi.fn(),
            };
            vi.mocked(projectService.exportProject).mockResolvedValue({
                archive: mockArchive as any,
                projectName: 'Test Project'
            });

            await projectController.exportProject(req, res);

            expect(projectService.exportProject).toHaveBeenCalledWith('p1', 'user-1');
            expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'application/zip');
            expect(mockArchive.pipe).toHaveBeenCalledWith(res);
            expect(logger.log).toHaveBeenCalledWith(expect.objectContaining({
                message: 'Project export started: p1',
            }));
        });

        it('should handle errors and log them', async () => {
            req.params = { id: 'p1' };
            vi.mocked(projectService.exportProject).mockRejectedValue(new Error('Project not found'));

            await projectController.exportProject(req, res);

            expect(res.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
            expect(logger.log).toHaveBeenCalledWith(expect.objectContaining({
                message: 'Error exporting project: Project not found',
                level: 'ERROR',
            }));
        });
    });
});
