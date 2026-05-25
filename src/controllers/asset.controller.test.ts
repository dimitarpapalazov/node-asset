import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as assetController from './asset.controller.js';
import * as assetService from '../services/asset.service.js';
import * as projectService from '../services/project.service.js';
import { InvalidParamError } from '../utils/errors.js';
import { HttpStatus } from '../constants/constants.js';

vi.mock('../services/asset.service.js', () => ({
    manipulateAsset: vi.fn(),
    uploadAsset: vi.fn(),
    getAssetByIdAndUserId: vi.fn(),
    getAssetById: vi.fn(),
    getAssetsByProjectId: vi.fn(),
    getLatestVersion: vi.fn(),
    getAllVersions: vi.fn(),
    deleteAsset: vi.fn(),
}));

vi.mock('../services/project.service.js', () => ({
    getProjectByIdAndUserId: vi.fn(),
}));

describe('Asset Controller', () => {
    let req: any;
    let res: any;

    beforeEach(() => {
        vi.clearAllMocks();
        req = {
            params: {},
            query: {},
            body: {},
            user: { userId: 'user-1' },
        };
        res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn().mockReturnThis(),
            send: vi.fn().mockReturnThis(),
        };
    });

    describe('getAssetsByProject', () => {
        it('should return assets if authorized', async () => {
            req.params = { projectId: 'p1' };
            req.query = { projectId: 'p1' };
            
            const mockProject = { id: 'p1', userId: 'user-1' };
            vi.mocked(projectService.getProjectByIdAndUserId).mockResolvedValue(mockProject as any);
            
            const mockAssets = [{ id: 'a1' }];
            vi.mocked(assetService.getAssetsByProjectId).mockResolvedValue(mockAssets as any);

            await assetController.getAssetsByProject(req, res);

            expect(assetService.getAssetsByProjectId).toHaveBeenCalledWith('p1');
            expect(res.status).toHaveBeenCalledWith(HttpStatus.OK);
            expect(res.json).toHaveBeenCalledWith(mockAssets);
        });

        it('should throw error if unauthorized', async () => {
            req.params = { projectId: 'p1' };
            req.query = { projectId: 'p1' };
            vi.mocked(projectService.getProjectByIdAndUserId).mockResolvedValue(undefined);

            await expect(assetController.getAssetsByProject(req, res)).rejects.toThrow('Project not found or unauthorized');
        });
    });

    describe('manipulateAsset', () => {
        it('should parse options correctly and call service if authorized', async () => {
            req.params = { assetId: 'a1', versionId: 'v1' };
            req.body = { width: '100', height: 200, fit: 'contain', format: 'webp' };
            
            const mockAsset = { id: 'a1', userId: 'user-1' };
            vi.mocked(assetService.getAssetByIdAndUserId).mockResolvedValue(mockAsset as any);
            
            const mockVersion = { id: 'v2' };
            vi.mocked(assetService.manipulateAsset).mockResolvedValue(mockVersion as any);

            await assetController.manipulateAsset(req, res);

            expect(assetService.manipulateAsset).toHaveBeenCalledWith('a1', 'v1', {
                width: 100,
                height: 200,
                fit: 'contain',
                format: 'webp',
            });
            expect(res.status).toHaveBeenCalledWith(HttpStatus.CREATED);
            expect(res.json).toHaveBeenCalledWith(mockVersion);
        });

        it('should throw error if unauthorized', async () => {
            req.params = { assetId: 'a1', versionId: 'v1' };
            vi.mocked(assetService.getAssetByIdAndUserId).mockResolvedValue(undefined);

            await expect(assetController.manipulateAsset(req, res)).rejects.toThrow('Asset not found or unauthorized');
        });

        it('should throw InvalidParamError if width is not a number', async () => {
            req.params = { assetId: 'a1', versionId: 'v1' };
            req.body = { width: 'invalid' };
            vi.mocked(assetService.getAssetByIdAndUserId).mockResolvedValue({ id: 'a1' } as any);

            await expect(assetController.manipulateAsset(req, res)).rejects.toThrow(InvalidParamError);
            await expect(assetController.manipulateAsset(req, res)).rejects.toThrow('Field "width" must be a number.');
        });
    });
});
