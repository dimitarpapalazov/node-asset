import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as projectService from './project.service.js';
import { db } from '../db/index.js';

vi.mock('../db/index.js', () => ({
    db: {
        insert: vi.fn(),
        select: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
    }
}));

const mockedDb = db as any;

describe('Project Service', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('createProject', () => {
        it('should create a new project', async () => {
            const mockProject = { id: '1', name: 'Test Project', userId: 'user1' };
            const queryBuilder = {
                values: vi.fn().mockReturnThis(),
                returning: vi.fn().mockResolvedValue([mockProject])
            };
            mockedDb.insert.mockReturnValue(queryBuilder);

            const result = await projectService.createProject({ name: 'Test Project', userId: 'user1' });

            expect(result).toEqual(mockProject);
            expect(mockedDb.insert).toHaveBeenCalled();
        });
    });

    describe('getUserProjects', () => {
        it('should return projects for a given user', async () => {
            const mockProjects = [{ id: '1', name: 'P1', userId: 'user1' }];
            const queryBuilder = {
                from: vi.fn().mockReturnThis(),
                where: vi.fn().mockResolvedValue(mockProjects)
            };
            mockedDb.select.mockReturnValue(queryBuilder);

            const result = await projectService.getUserProjects('user1');

            expect(result).toEqual(mockProjects);
            expect(mockedDb.select).toHaveBeenCalled();
        });
    });

    describe('updateProject', () => {
        it('should update a project name if owned by user', async () => {
            const mockProject = { id: '1', name: 'Updated', userId: 'user1' };
            const queryBuilder = {
                set: vi.fn().mockReturnThis(),
                where: vi.fn().mockReturnThis(),
                returning: vi.fn().mockResolvedValue([mockProject])
            };
            mockedDb.update.mockReturnValue(queryBuilder);

            const result = await projectService.updateProject('1', 'user1', 'Updated');

            expect(result).toEqual(mockProject);
            expect(mockedDb.update).toHaveBeenCalled();
            expect(queryBuilder.set).toHaveBeenCalled();
            expect(queryBuilder.where).toHaveBeenCalled();
            expect(queryBuilder.returning).toHaveBeenCalled();
        });
    });

    describe('deleteProject', () => {
        it('should delete a project if owned by user', async () => {
            const queryBuilder = {
                where: vi.fn().mockResolvedValue(undefined)
            };
            mockedDb.delete.mockReturnValue(queryBuilder);
            
            await projectService.deleteProject('1', 'user1');
            
            expect(mockedDb.delete).toHaveBeenCalled();
            expect(queryBuilder.where).toHaveBeenCalled();
        });
    });
});
