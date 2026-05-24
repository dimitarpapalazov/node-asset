import { db } from '../db/index.js';
import { assets, assetVersions } from '../db/schema.js';
import { eq, desc } from 'drizzle-orm';
import { storageService } from './storage.service.js';
import sharp from 'sharp';

export interface ManipulationOptions extends sharp.ResizeOptions {
    format?: keyof sharp.FormatEnum;
}

export type Asset = typeof assets.$inferSelect;
export type AssetVersion = typeof assetVersions.$inferSelect;

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
    
    return { ...asset, latestVersion: version };
};

export const getAssetById = async (id: string): Promise<Asset | undefined> => {
    const [asset] = await db.select()
        .from(assets)
        .where(eq(assets.id, id));
    
    return asset;
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
    
    if (Object.keys(resizeOptions).length > 0) {
        pipeline = pipeline.resize(resizeOptions);
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
    
    return newVersion;
};

export const deleteAsset = async (id: string): Promise<void> => {
    await db.delete(assets).where(eq(assets.id, id));
};
