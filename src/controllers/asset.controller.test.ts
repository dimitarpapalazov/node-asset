import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as assetController from './asset.controller.js';
import * as assetService from '../services/asset.service.js';
import * as projectService from '../services/project.service.js';
import { InvalidParamError, NotFoundError } from '../utils/errors.js';
import { HttpStatus } from '../constants/constants.js';
import { logger } from '../services/logger/logger.factory.js';

vi.mock('../services/logger/logger.factory.js', () => ({
    logger: {
        log: vi.fn(),
    },
}));

vi.mock('../services/asset.service.js', () => ({
    manipulateAsset: vi.fn(),
    uploadAsset: vi.fn(),
    getAssetByIdAndUserId: vi.fn(),
    getAssetById: vi.fn(),
    getAssetsByProjectId: vi.fn(),
    getLatestVersion: vi.fn(),
    getAllVersions: vi.fn(),
    deleteAsset: vi.fn(),
    generateAssetKey: vi.fn(),
    getLatestAssetVersionByKey: vi.fn(),
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
            validData: {
                params: {},
                query: {},
                body: {},
            },
            user: { userId: 'user-1' },
            traceId: 'test-trace-id',
        };
        res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn().mockReturnThis(),
            send: vi.fn().mockReturnThis(),
            setHeader: vi.fn().mockReturnThis(),
        };
    });

    describe('getAssetsByProject', () => {
        const validProjectId = '123e4567-e89b-12d3-a456-426614174003';

        it('should return assets if authorized', async () => {
            req.validData.params = { projectId: validProjectId };
            
            const mockProject = { id: validProjectId, userId: 'user-1' };
            vi.mocked(projectService.getProjectByIdAndUserId).mockResolvedValue(mockProject as any);
            
            const mockAssets = [{ id: 'a1' }];
            vi.mocked(assetService.getAssetsByProjectId).mockResolvedValue(mockAssets as any);

            await assetController.getAssetsByProject(req, res);

            expect(assetService.getAssetsByProjectId).toHaveBeenCalledWith(validProjectId);
            expect(res.status).toHaveBeenCalledWith(HttpStatus.OK);
            expect(res.json).toHaveBeenCalledWith(mockAssets);
        });

        it('should throw NotFoundError if unauthorized', async () => {
            req.validData.params = { projectId: validProjectId };
            vi.mocked(projectService.getProjectByIdAndUserId).mockResolvedValue(undefined);

            await expect(assetController.getAssetsByProject(req, res))
                .rejects.toThrow(NotFoundError);
        });
    });

    describe('manipulateAsset', () => {
        const validAssetId = '123e4567-e89b-12d3-a456-426614174001';
        const validVersionId = '123e4567-e89b-12d3-a456-426614174002';

        it('should call service if authorized', async () => {
            req.validData.params = { assetId: validAssetId, versionId: validVersionId };
            req.validData.body = { width: 100, height: 200, fit: 'contain', format: 'webp' };
            
            const mockAsset = { id: validAssetId, userId: 'user-1' };
            vi.mocked(assetService.getAssetByIdAndUserId).mockResolvedValue(mockAsset as any);
            
            const mockVersion = { id: 'v2' };
            vi.mocked(assetService.manipulateAsset).mockResolvedValue(mockVersion as any);

            await assetController.manipulateAsset(req, res);

            expect(assetService.manipulateAsset).toHaveBeenCalledWith(validAssetId, validVersionId, {
                width: 100,
                height: 200,
                fit: 'contain',
                format: 'webp',
            });
            expect(res.status).toHaveBeenCalledWith(HttpStatus.CREATED);
            expect(res.json).toHaveBeenCalledWith(mockVersion);
            expect(logger.log).toHaveBeenCalled();
        });

        it('should throw NotFoundError if unauthorized', async () => {
            req.validData.params = { assetId: validAssetId, versionId: validVersionId };
            vi.mocked(assetService.getAssetByIdAndUserId).mockResolvedValue(undefined);

            await expect(assetController.manipulateAsset(req, res))
                .rejects.toThrow(NotFoundError);
        });
    });

    describe('generateAssetKey', () => {
        const validAssetId = '123e4567-e89b-12d3-a456-426614174001';

        it('should generate a key if authorized', async () => {
            req.validData.params = { id: validAssetId };
            req.validData.body = { expiresInSeconds: 3600 };
            
            const mockAsset = { id: validAssetId, userId: 'user-1' };
            vi.mocked(assetService.getAssetByIdAndUserId).mockResolvedValue(mockAsset as any);
            
            const mockKey = { id: 'k1', key: 'key-123' };
            vi.mocked(assetService.generateAssetKey).mockResolvedValue(mockKey as any);

            await assetController.generateAssetKey(req, res);

            expect(assetService.generateAssetKey).toHaveBeenCalledWith(validAssetId, 3600);
            expect(res.status).toHaveBeenCalledWith(HttpStatus.CREATED);
            expect(res.json).toHaveBeenCalledWith(mockKey);
        });

        it('should throw NotFoundError if unauthorized', async () => {
            req.validData.params = { id: validAssetId };
            vi.mocked(assetService.getAssetByIdAndUserId).mockResolvedValue(undefined);

            await expect(assetController.generateAssetKey(req, res))
                .rejects.toThrow(NotFoundError);
        });
    });

    describe('getPublicAsset', () => {
        it('should return image buffer for a valid key', async () => {
            req.validData.params = { key: 'valid-key' };
            
            const mockData = { buffer: Buffer.from('image-data'), format: 'png' };
            vi.mocked(assetService.getLatestAssetVersionByKey).mockResolvedValue(mockData);

            await assetController.getPublicAsset(req, res);

            expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'image/png');
            expect(res.status).toHaveBeenCalledWith(HttpStatus.OK);
            expect(res.send).toHaveBeenCalledWith(mockData.buffer);
        });
    });
});
