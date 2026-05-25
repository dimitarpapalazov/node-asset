import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as projectController from './project.controller.js';
import * as projectService from '../services/project.service.js';
import { HttpStatus } from '../constants/constants.js';

vi.mock('../services/project.service.js', () => ({
    createProject: vi.fn(),
    getUserProjects: vi.fn(),
    updateProject: vi.fn(),
    deleteProject: vi.fn(),
    exportProject: vi.fn(),
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
        };
        res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn().mockReturnThis(),
            send: vi.fn().mockReturnThis(),
            setHeader: vi.fn(),
        };
    });

    describe('exportProject', () => {
        it('should set headers and pipe archive to response', async () => {
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

            expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'application/zip');
            expect(res.setHeader).toHaveBeenCalledWith('Content-Disposition', 'attachment; filename="Test Project.zip"');
            expect(mockArchive.pipe).toHaveBeenCalledWith(res);
        });

        it('should handle errors if project not found', async () => {
            req.params = { id: 'p1' };
            vi.mocked(projectService.exportProject).mockRejectedValue(new Error('Project not found'));

            await projectController.exportProject(req, res);

            expect(res.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
            expect(res.json).toHaveBeenCalledWith({ message: 'Project not found' });
        });
    });
});
