import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as assetController from './asset.controller.js';
import * as assetService from '../services/asset.service.js';
import { InvalidParamError } from '../utils/errors.js';
import { HttpStatus } from '../constants/constants.js';

vi.mock('../services/asset.service.js', () => ({
    manipulateAsset: vi.fn(),
    uploadAsset: vi.fn(),
    getAssetById: vi.fn(),
    getLatestVersion: vi.fn(),
    getAllVersions: vi.fn(),
    deleteAsset: vi.fn(),
}));

describe('Asset Controller', () => {
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
        };
    });

    describe('manipulateAsset', () => {
        it('should parse options correctly and call service', async () => {
            req.params = { assetId: 'a1', versionId: 'v1' };
            req.body = { width: '100', height: 200, fit: 'contain', format: 'webp' };
            
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

        it('should throw InvalidParamError if width is not a number', async () => {
            req.params = { assetId: 'a1', versionId: 'v1' };
            req.body = { width: 'invalid' };

            await expect(assetController.manipulateAsset(req, res)).rejects.toThrow(InvalidParamError);
            await expect(assetController.manipulateAsset(req, res)).rejects.toThrow('Field "width" must be a number.');
        });

        it('should throw InvalidParamError if height is not a number', async () => {
            req.params = { assetId: 'a1', versionId: 'v1' };
            req.body = { height: 'invalid' };

            await expect(assetController.manipulateAsset(req, res)).rejects.toThrow(InvalidParamError);
            await expect(assetController.manipulateAsset(req, res)).rejects.toThrow('Field "height" must be a number.');
        });

        it('should throw InvalidParamError if fit is invalid', async () => {
            req.params = { assetId: 'a1', versionId: 'v1' };
            req.body = { fit: 'invalid-fit' };

            await expect(assetController.manipulateAsset(req, res)).rejects.toThrow(InvalidParamError);
            await expect(assetController.manipulateAsset(req, res)).rejects.toThrow('Field "fit" must be one of: cover, contain, fill, inside, outside.');
        });

        it('should work with empty body', async () => {
            req.params = { assetId: 'a1', versionId: 'v1' };
            req.body = {};

            vi.mocked(assetService.manipulateAsset).mockResolvedValue({ id: 'v2' } as any);

            await assetController.manipulateAsset(req, res);

            expect(assetService.manipulateAsset).toHaveBeenCalledWith('a1', 'v1', {});
        });
    });
});
