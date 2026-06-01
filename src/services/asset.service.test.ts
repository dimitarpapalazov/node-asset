import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as assetService from './asset.service.js';
import { db } from '../db/index.js';
import { storageService } from './storage.service.js';
import sharp from 'sharp';
import { logger } from './logger/logger.factory.js';
import { LogLevel } from './logger/index.js';
import { NotFoundError } from '../utils/errors.js';
import { AssetFit } from '../constants/constants.js';

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

vi.mock('./logger/logger.factory.js', () => ({
    logger: {
        log: vi.fn(),
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
            expect(logger.log).toHaveBeenCalledWith(expect.objectContaining({
                level: LogLevel.INFO,
                message: expect.stringContaining('Asset created in DB: asset-1'),
            }));
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

            const options: assetService.ManipulationOptions = { width: 50, fit: AssetFit.COVER };
            const result = await assetService.manipulateAsset('a1', 'v1', options);

            expect(storageService.get).toHaveBeenCalledWith('h1');
            const sharpInstance = vi.mocked(sharp).mock.results[0].value;
            expect(sharpInstance.resize).toHaveBeenCalledWith({ width: 50, fit: 'cover' });
            expect(storageService.save).toHaveBeenCalledWith(Buffer.from('processed-data'));
            expect(result).toHaveProperty('id', 'v2');
            expect(logger.log).toHaveBeenCalledWith(expect.objectContaining({
                level: LogLevel.INFO,
                message: expect.stringContaining('New asset version created: v2 for asset a1'),
            }));
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
        it('should delete from storage if no other asset uses the hash', async () => {
            const assetId = 'asset-1';
            const hash = 'unique-hash';
            
            // 1. Mock select versions for this asset
            (db.select as any).mockReturnValueOnce({
                from: vi.fn(() => ({
                    where: vi.fn(() => Promise.resolve([{ hash }])),
                })),
            });

            // 2. Mock asset deletion
            (db.delete as any).mockReturnValue({
                where: vi.fn(() => Promise.resolve()),
            });

            // 3. Mock reference check (no other references)
            (db.select as any).mockReturnValueOnce({
                from: vi.fn(() => ({
                    where: vi.fn(() => ({
                        limit: vi.fn(() => Promise.resolve([])),
                    })),
                })),
            });

            await assetService.deleteAsset(assetId);

            expect(storageService.delete).toHaveBeenCalledWith(hash);
            expect(logger.log).toHaveBeenCalledWith(expect.objectContaining({
                level: LogLevel.INFO,
                message: expect.stringContaining('Asset record deleted from DB: asset-1'),
            }));
        });

        it('should NOT delete from storage if another asset uses the hash', async () => {
            const assetId = 'asset-1';
            const hash = 'shared-hash';
            
            // 1. Mock select versions for this asset
            (db.select as any).mockReturnValueOnce({
                from: vi.fn(() => ({
                    where: vi.fn(() => Promise.resolve([{ hash }])),
                })),
            });

            // 2. Mock asset deletion
            (db.delete as any).mockReturnValue({
                where: vi.fn(() => Promise.resolve()),
            });

            // 3. Mock reference check (has other references)
            (db.select as any).mockReturnValueOnce({
                from: vi.fn(() => ({
                    where: vi.fn(() => ({
                        limit: vi.fn(() => Promise.resolve([{ id: 'other-v' }])),
                    })),
                })),
            });

            await assetService.deleteAsset(assetId);

            expect(storageService.delete).not.toHaveBeenCalled();
            expect(logger.log).toHaveBeenCalledWith(expect.objectContaining({
                level: LogLevel.INFO,
                message: expect.stringContaining('Asset record deleted from DB: asset-1'),
            }));
        });
    });

    describe('generateAssetKey', () => {
        it('should generate a permanent asset key when no expiration is provided', async () => {
            const assetId = 'asset-1';
            const keyData = { id: 'key-1', key: 'random-key', assetId, expiresAt: null };

            (db.insert as any).mockReturnValue({
                values: vi.fn(() => ({
                    returning: vi.fn(() => [keyData]),
                })),
            });

            const result = await assetService.generateAssetKey(assetId);

            expect(result).toEqual(keyData);
            expect(db.insert).toHaveBeenCalled();
        });

        it('should generate an expiring asset key when expiresInSeconds is provided', async () => {
            const assetId = 'asset-1';
            const expiresInSeconds = 3600;
            
            (db.insert as any).mockReturnValue({
                values: vi.fn(() => ({
                    returning: vi.fn(() => [{ id: 'key-1', assetId, expiresAt: new Date() }]),
                })),
            });

            await assetService.generateAssetKey(assetId, expiresInSeconds);

            expect(db.insert).toHaveBeenCalledWith(expect.anything());
        });
    });

    describe('getLatestAssetVersionByKey', () => {
        it('should return asset data for a valid key', async () => {
            const key = 'valid-key';
            const keyRecord = { id: 'k1', key, assetId: 'a1', expiresAt: null };
            const latestVersion = { id: 'v1', assetId: 'a1', hash: 'h1', format: 'png' };

            // 1. Mock key lookup
            (db.select as any).mockReturnValueOnce({
                from: vi.fn(() => ({
                    where: vi.fn(() => [keyRecord]),
                })),
            });

            // 2. Mock latest version lookup
            (db.select as any).mockReturnValueOnce({
                from: vi.fn(() => ({
                    where: vi.fn(() => ({
                        orderBy: vi.fn(() => ({
                            limit: vi.fn(() => [latestVersion]),
                        })),
                    })),
                })),
            });

            const result = await assetService.getLatestAssetVersionByKey(key);

            expect(result).toEqual({
                buffer: Buffer.from('fake-data'),
                format: 'png',
            });
            expect(storageService.get).toHaveBeenCalledWith('h1');
        });

        it('should throw NotFoundError if key is not found or expired', async () => {
            (db.select as any).mockReturnValue({
                from: vi.fn(() => ({
                    where: vi.fn(() => []),
                })),
            });

            await expect(assetService.getLatestAssetVersionByKey('invalid-key'))
                .rejects.toThrow(NotFoundError);
        });
    });
});
