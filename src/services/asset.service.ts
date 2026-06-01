import { db } from '../db/index.js';
import { assets, assetVersions, assetKeys } from '../db/schema.js';
import { eq, and, desc, or, gt, isNull } from 'drizzle-orm';
import { storageService } from './storage.service.js';
import { AssetFit } from '../constants/constants.js';
import sharp from 'sharp';
import { logger } from './logger/logger.factory.js';
import { LogLevel } from './logger/index.js';
import { config } from '../config/config.js';
import crypto from 'node:crypto';
import { NotFoundError } from '../utils/errors.js';

export interface ManipulationOptions {
    width?: number;
    height?: number;
    fit?: AssetFit;
    format?: keyof sharp.FormatEnum;
}

export type Asset = typeof assets.$inferSelect;
export type AssetVersion = typeof assetVersions.$inferSelect;
export type AssetKey = typeof assetKeys.$inferSelect;

export const uploadAsset = async (userId: string, projectId: string, name: string, buffer: Buffer): Promise<Asset & { latestVersion: AssetVersion }> => {
    const metadata = await sharp(buffer).metadata();
    const hash = await storageService.save(buffer);
    
    const [asset] = await db.insert(assets)
        .values({
            name,
            userId,
            projectId,
        })
        .returning();
    
    const [version] = await db.insert(assetVersions)
        .values({
            assetId: asset.id,
            hash,
            size: buffer.length,
            format: metadata.format || 'unknown',
            width: metadata.width,
            height: metadata.height,
        })
        .returning();

    logger.log({
        timestamp: new Date().toISOString(),
        level: LogLevel.INFO,
        message: `Asset created in DB: ${asset.id}`,
        userId,
        environment: config.env,
        traceId: 'system',
    });
    
    return { ...asset, latestVersion: version };
};

export const getAssetById = async (id: string): Promise<Asset | undefined> => {
    const [asset] = await db.select()
        .from(assets)
        .where(eq(assets.id, id));
    
    return asset;
};

export const getAssetByIdAndUserId = async (id: string, userId: string): Promise<Asset | undefined> => {
    const [asset] = await db.select()
        .from(assets)
        .where(and(eq(assets.id, id), eq(assets.userId, userId)));
    
    return asset;
};

export const getAssetsByProjectId = async (projectId: string): Promise<Asset[]> => {
    return await db.select()
        .from(assets)
        .where(eq(assets.projectId, projectId));
};

export const getLatestVersion = async (assetId: string): Promise<AssetVersion | undefined> => {
    const [version] = await db.select()
        .from(assetVersions)
        .where(eq(assetVersions.assetId, assetId))
        .orderBy(desc(assetVersions.createdAt))
        .limit(1);
    
    return version;
};

export const getAllVersions = async (assetId: string): Promise<AssetVersion[]> => {
    return await db.select()
        .from(assetVersions)
        .where(eq(assetVersions.assetId, assetId))
        .orderBy(desc(assetVersions.createdAt));
};

export const manipulateAsset = async (assetId: string, versionId: string, options: ManipulationOptions): Promise<AssetVersion> => {
    const [existingVersion] = await db.select()
        .from(assetVersions)
        .where(eq(assetVersions.id, versionId));
    
    if (!existingVersion) {
        throw new Error('Version not found');
    }
    
    const buffer = await storageService.get(existingVersion.hash);
    
    let pipeline = sharp(buffer);
    
    const { format, ...resizeOptions } = options;
    
    if (resizeOptions.width || resizeOptions.height) {
        pipeline = pipeline.resize({
            ...resizeOptions,
            fit: resizeOptions.fit || AssetFit.COVER
        });
    }
    
    if (format) {
        pipeline = pipeline.toFormat(format);
    }
    
    const processedBuffer = await pipeline.toBuffer();
    const metadata = await sharp(processedBuffer).metadata();
    const hash = await storageService.save(processedBuffer);
    
    const [newVersion] = await db.insert(assetVersions)
        .values({
            assetId,
            hash,
            size: processedBuffer.length,
            format: metadata.format || 'unknown',
            width: metadata.width,
            height: metadata.height,
            params: options,
        })
        .returning();

    logger.log({
        timestamp: new Date().toISOString(),
        level: LogLevel.INFO,
        message: `New asset version created: ${newVersion.id} for asset ${assetId}`,
        environment: config.env,
        traceId: 'system',
    });
    
    return newVersion;
};

export const deleteAsset = async (id: string): Promise<void> => {
    const versions = await db.select({ hash: assetVersions.hash })
        .from(assetVersions)
        .where(eq(assetVersions.assetId, id));
    
    const uniqueHashes = [...new Set(versions.map(v => v.hash))];

    await db.delete(assets).where(eq(assets.id, id));

    for (const hash of uniqueHashes) {
        const [otherReference] = await db.select({ id: assetVersions.id })
            .from(assetVersions)
            .where(eq(assetVersions.hash, hash))
            .limit(1);
        
        if (!otherReference) {
            await storageService.delete(hash);
        }
    }

    logger.log({
        timestamp: new Date().toISOString(),
        level: LogLevel.INFO,
        message: `Asset record deleted from DB: ${id}`,
        environment: config.env,
        traceId: 'system',
    });
};

export const generateAssetKey = async (assetId: string, expiresInSeconds?: number): Promise<AssetKey> => {
    const key = crypto.randomBytes(32).toString('hex');
    const expiresAt = expiresInSeconds ? new Date(Date.now() + expiresInSeconds * 1000) : null;

    const [assetKey] = await db.insert(assetKeys)
        .values({
            key,
            assetId,
            expiresAt,
        })
        .returning();

    logger.log({
        timestamp: new Date().toISOString(),
        level: LogLevel.INFO,
        message: `Asset key generated: ${assetKey.id} for asset ${assetId}`,
        environment: config.env,
        traceId: 'system',
    });

    return assetKey;
};

export const getLatestAssetVersionByKey = async (key: string): Promise<{ buffer: Buffer; format: string }> => {
    const now = new Date();

    const [keyRecord] = await db.select()
        .from(assetKeys)
        .where(and(
            eq(assetKeys.key, key),
            or(isNull(assetKeys.expiresAt), gt(assetKeys.expiresAt, now))
        ));

    if (!keyRecord) {
        throw new NotFoundError('Invalid or expired asset key');
    }

    const latestVersion = await getLatestVersion(keyRecord.assetId);

    if (!latestVersion) {
        throw new NotFoundError('No versions found for this asset');
    }

    const buffer = await storageService.get(latestVersion.hash);

    return {
        buffer,
        format: latestVersion.format,
    };
};
