import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as projectService from './project.service.js';
import { db } from '../db/index.js';
import * as assetService from './asset.service.js';
import { storageService } from './storage.service.js';
import archiver from 'archiver';
import sharp from 'sharp';

vi.mock('../db/index.js', () => ({
    db: {
        insert: vi.fn(),
        select: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
    }
}));

vi.mock('./asset.service.js', () => ({
    getLatestVersion: vi.fn(),
}));

vi.mock('./storage.service.js', () => ({
    storageService: {
        get: vi.fn(),
    },
}));

vi.mock('archiver', () => {
    const mockArchiver = {
        append: vi.fn().mockReturnThis(),
        finalize: vi.fn().mockResolvedValue(undefined),
        pipe: vi.fn().mockReturnThis(),
        on: vi.fn().mockReturnThis(),
        emit: vi.fn(),
    };
    return { default: vi.fn(() => mockArchiver) };
});

vi.mock('sharp', () => {
    const mockSharp = {
        resize: vi.fn().mockReturnThis(),
        toFormat: vi.fn().mockReturnThis(),
        toBuffer: vi.fn().mockResolvedValue(Buffer.from('processed-image')),
    };
    const sharpFn = vi.fn(() => mockSharp);
    (sharpFn as any).cache = vi.fn();
    return { default: sharpFn };
});

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

    describe('exportProject', () => {
        it('should create a zip archive with data.json and processed assets', async () => {
            const mockProject = { id: 'p1', name: 'My Project' };
            const mockAssets = [{ id: 'a1', name: 'image' }];
            const mockVersion = { hash: 'h1', format: 'png', width: 100, height: 100 };

            mockedDb.select.mockReturnValueOnce({
                from: vi.fn().mockReturnThis(),
                where: vi.fn().mockResolvedValue([mockProject])
            });

            mockedDb.select.mockReturnValueOnce({
                from: vi.fn().mockReturnThis(),
                where: vi.fn().mockResolvedValue(mockAssets)
            });

            vi.mocked(assetService.getLatestVersion).mockResolvedValue(mockVersion as any);
            vi.mocked(storageService.get).mockResolvedValue(Buffer.from('raw-image'));

            const { archive, projectName } = await projectService.exportProject('p1', 'user1');

            expect(projectName).toBe('My Project');
            expect(archiver).toHaveBeenCalledWith('zip', expect.any(Object));
            
            await new Promise(resolve => setTimeout(resolve, 10));

            expect(archive.append).toHaveBeenCalledWith(expect.stringContaining('My Project'), { name: 'data.json' });
            expect(archive.append).toHaveBeenCalledWith(Buffer.from('processed-image'), { name: 'assets/image.png' });
            expect(archive.finalize).toHaveBeenCalled();
        });

        it('should throw error if project not found or unauthorized', async () => {
            mockedDb.select.mockReturnValue({
                from: vi.fn().mockReturnThis(),
                where: vi.fn().mockResolvedValue([])
            });

            await expect(projectService.exportProject('p1', 'wrong-user')).rejects.toThrow('Project not found or unauthorized');
        });
    });
});
