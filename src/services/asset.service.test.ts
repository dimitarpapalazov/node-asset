import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as assetService from './asset.service.js';
import { db } from '../db/index.js';
import { storageService } from './storage.service.js';
import sharp from 'sharp';

// Mock dependencies
vi.mock('../db/index.js', () => ({
    db: {
        insert: vi.fn(() => ({
            values: vi.fn(() => ({
                returning: vi.fn(() => [{ id: 'uuid-1' }]),
            })),
        })),
        select: vi.fn(() => ({
            from: vi.fn(() => ({
                where: vi.fn(() => ({
                    orderBy: vi.fn(() => ({
                        limit: vi.fn(() => []),
                    })),
                })),
            })),
        })),
        delete: vi.fn(() => ({
            where: vi.fn(() => Promise.resolve()),
        })),
    },
}));

vi.mock('./storage.service.js', () => ({
    storageService: {
        save: vi.fn().mockResolvedValue('fake-hash'),
        get: vi.fn().mockResolvedValue(Buffer.from('fake-data')),
        exists: vi.fn().mockResolvedValue(true),
        delete: vi.fn().mockResolvedValue(undefined),
    },
}));

// Mock sharp
vi.mock('sharp', () => {
    const sharpMock = vi.fn(() => ({
        metadata: vi.fn().mockResolvedValue({ format: 'png', width: 100, height: 100 }),
        resize: vi.fn().mockReturnThis(),
        toFormat: vi.fn().mockReturnThis(),
        toBuffer: vi.fn().mockResolvedValue(Buffer.from('processed-data')),
    }));
    return { default: sharpMock };
});

describe('Asset Service', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('uploadAsset', () => {
        it('should upload an asset and create a version', async () => {
            const buffer = Buffer.from('test-image');
            const assetData = { id: 'asset-1', name: 'test.png', userId: 'user-1', projectId: 'project-1' };
            const versionData = { id: 'version-1', assetId: 'asset-1', hash: 'fake-hash', size: buffer.length, format: 'png', width: 100, height: 100 };

            // Setup mock returns
            (db.insert as any)
                .mockReturnValueOnce({
                    values: vi.fn(() => ({
                        returning: vi.fn(() => [assetData]),
                    })),
                })
                .mockReturnValueOnce({
                    values: vi.fn(() => ({
                        returning: vi.fn(() => [versionData]),
                    })),
                });

            const result = await assetService.uploadAsset('user-1', 'project-1', 'test.png', buffer);

            expect(storageService.save).toHaveBeenCalledWith(buffer);
            expect(db.insert).toHaveBeenCalledTimes(2);
            expect(result).toHaveProperty('id', 'asset-1');
            expect(result.latestVersion).toHaveProperty('hash', 'fake-hash');
        });
    });

    describe('manipulateAsset', () => {
        it('should create a new version after manipulation with advanced options', async () => {
            const existingVersion = { id: 'v1', assetId: 'a1', hash: 'h1', format: 'png' };
            const newVersionData = { id: 'v2', assetId: 'a1', hash: 'h2', format: 'webp', width: 50, height: 50, params: { width: 50, fit: 'cover' } };

            // Setup mocks
            (db.select as any).mockReturnValue({
                from: vi.fn(() => ({
                    where: vi.fn(() => [existingVersion]),
                })),
            });

            (db.insert as any).mockReturnValue({
                values: vi.fn(() => ({
                    returning: vi.fn(() => [newVersionData]),
                })),
            });

            const options: assetService.ManipulationOptions = { width: 50, fit: 'cover' };
            const result = await assetService.manipulateAsset('a1', 'v1', options);

            expect(storageService.get).toHaveBeenCalledWith('h1');
            const sharpInstance = vi.mocked(sharp).mock.results[0].value;
            expect(sharpInstance.resize).toHaveBeenCalledWith({ width: 50, fit: 'cover' });
            expect(storageService.save).toHaveBeenCalledWith(Buffer.from('processed-data'));
            expect(result).toHaveProperty('id', 'v2');
        });

        it('should use default "cover" fit if not specified but width/height is present', async () => {
            const existingVersion = { id: 'v1', assetId: 'a1', hash: 'h1', format: 'png' };
            (db.select as any).mockReturnValue({
                from: vi.fn(() => ({
                    where: vi.fn(() => [existingVersion]),
                })),
            });
            (db.insert as any).mockReturnValue({
                values: vi.fn(() => ({
                    returning: vi.fn(() => [{ id: 'v2' }]),
                })),
            });

            await assetService.manipulateAsset('a1', 'v1', { width: 100 });
            
            const sharpInstance = vi.mocked(sharp).mock.results[0].value;
            expect(sharpInstance.resize).toHaveBeenCalledWith({ width: 100, fit: 'cover' });
        });
    });

    describe('getAssetById', () => {
        it('should return an asset by id', async () => {
            const assetData = { id: 'asset-1', name: 'test.png' };
            (db.select as any).mockReturnValue({
                from: vi.fn(() => ({
                    where: vi.fn(() => [assetData]),
                })),
            });

            const result = await assetService.getAssetById('asset-1');
            expect(result).toEqual(assetData);
        });
    });

    describe('getLatestVersion', () => {
        it('should return the latest version of an asset', async () => {
            const versionData = { id: 'v2', assetId: 'a1', createdAt: new Date() };
            (db.select as any).mockReturnValue({
                from: vi.fn(() => ({
                    where: vi.fn(() => ({
                        orderBy: vi.fn(() => ({
                            limit: vi.fn(() => [versionData]),
                        })),
                    })),
                })),
            });

            const result = await assetService.getLatestVersion('a1');
            expect(result).toEqual(versionData);
        });
    });

    describe('getAllVersions', () => {
        it('should return all versions of an asset', async () => {
            const versions = [
                { id: 'v2', assetId: 'a1' },
                { id: 'v1', assetId: 'a1' }
            ];
            (db.select as any).mockReturnValue({
                from: vi.fn(() => ({
                    where: vi.fn(() => ({
                        orderBy: vi.fn(() => versions),
                    })),
                })),
            });

            const result = await assetService.getAllVersions('a1');
            expect(result).toEqual(versions);
            expect(result).toHaveLength(2);
        });
    });

    describe('deleteAsset', () => {
        it('should delete the asset from database', async () => {
            await assetService.deleteAsset('asset-1');
            expect(db.delete).toHaveBeenCalled();
        });
    });
});
