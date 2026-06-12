import { db } from '../db/index.js';
import { projects, assets, assetVersions, exportJobs } from '../db/schema.js';
import { eq, and, inArray } from 'drizzle-orm';
import archiver from 'archiver';
import sharp from 'sharp';
import AdmZip from 'adm-zip';
import * as assetService from './asset.service.js';
import { storageService } from './storage.service.js';
import { EXPORT_CONFIG, AssetFit, ExportStatus, QueueName } from '../constants/constants.js';
import { logger } from './logger/logger.factory.js';
import { LogLevel } from './logger/index.js';
import { config } from '../config/config.js';
import { queueService } from './queue.service.js';
import { BadRequestError } from '../utils/errors.js';

export interface CreateProjectInput {
    name: string;
    userId: string;
}

export type Project = typeof projects.$inferSelect;

export type ExportJob = typeof exportJobs.$inferSelect;

export const createProject = async (input: CreateProjectInput): Promise<Project> => {
    const [project] = await db.insert(projects)
        .values({
            name: input.name,
            userId: input.userId,
        })
        .returning();

    logger.log({
        timestamp: new Date().toISOString(),
        level: LogLevel.INFO,
        message: `Project created in DB: ${project.id}`,
        userId: input.userId,
        environment: config.env,
        traceId: 'system',
    });

    return project;
};

export const getProjectById = async (id: string): Promise<Project | undefined> => {
    const [project] = await db.select()
        .from(projects)
        .where(eq(projects.id, id));

    return project;
};

export const getProjectByIdAndUserId = async (id: string, userId: string): Promise<Project | undefined> => {
    const [project] = await db.select()
        .from(projects)
        .where(and(eq(projects.id, id), eq(projects.userId, userId)));

    return project;
};

export const getUserProjects = async (userId: string): Promise<Project[]> => {
    return await db.select()
        .from(projects)
        .where(eq(projects.userId, userId));
};

export const updateProject = async (id: string, userId: string, name: string): Promise<Project | undefined> => {
    const [project] = await db.update(projects)
        .set({ name, updatedAt: new Date() })
        .where(and(eq(projects.id, id), eq(projects.userId, userId)))
        .returning();

    if (project) {
        logger.log({
            timestamp: new Date().toISOString(),
            level: LogLevel.INFO,
            message: `Project updated in DB: ${id}`,
            userId,
            environment: config.env,
            traceId: 'system',
        });
    }

    return project;
};

export const deleteProject = async (id: string, userId: string): Promise<void> => {
    // 1. Find all assets associated with the project
    const projectAssets = await db.select({ id: assets.id })
        .from(assets)
        .where(eq(assets.projectId, id));

    const assetIds = projectAssets.map(a => a.id);

    let hashesToDelete: string[] = [];

    if (assetIds.length > 0) {
        // 2. Get all asset versions for these assets
        const versions = await db.select({ hash: assetVersions.hash })
            .from(assetVersions)
            .where(inArray(assetVersions.assetId, assetIds));

        hashesToDelete = [...new Set(versions.map(v => v.hash))];
    }

    // 3. Delete the project (cascades to assets and assetVersions)
    await db.delete(projects)
        .where(and(eq(projects.id, id), eq(projects.userId, userId)));

    // 4. Delete files from storage if no longer referenced
    for (const hash of hashesToDelete) {
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
        message: `Project record deleted from DB: ${id}`,
        userId,
        environment: config.env,
        traceId: 'system',
    });
};

export const initiateExport = async (projectId: string, userId: string): Promise<string> => {
    const project = await getProjectByIdAndUserId(projectId, userId);

    if (!project) {
        throw new Error('Project not found or unauthorized');
    }

    const [job] = await db.insert(exportJobs)
        .values({
            projectId,
            userId,
            status: ExportStatus.PENDING,
        })
        .returning();

    await queueService.publish(QueueName.PROJECT_EXPORTS, {
        jobId: job.id,
        projectId,
        userId,
    });

    logger.log({
        timestamp: new Date().toISOString(),
        level: LogLevel.INFO,
        message: `Export job initiated: ${job.id} for project ${projectId}`,
        userId,
        environment: config.env,
        traceId: 'system',
    });

    return job.id;
};

export const getExportJobStatus = async (jobId: string, userId: string): Promise<ExportJob | undefined> => {
    const [job] = await db.select()
        .from(exportJobs)
        .where(and(eq(exportJobs.id, jobId), eq(exportJobs.userId, userId)));

    return job;
};

export const exportProject = async (projectId: string, userId: string): Promise<{ archive: archiver.Archiver, projectName: string }> => {
    const project = await getProjectByIdAndUserId(projectId, userId);

    if (!project) {
        throw new Error('Project not found or unauthorized');
    }

    const projectAssets = await db.select()
        .from(assets)
        .where(eq(assets.projectId, projectId));

    const assetsWithVersions = await Promise.all(
        projectAssets.map(async (asset) => {
            const latestVersion = await assetService.getLatestVersion(asset.id);
            return { ...asset, latestVersion };
        })
    );

    const archive = archiver('zip', { zlib: { level: EXPORT_CONFIG.ZIP_COMPRESSION_LEVEL } });

    const exportData = {
        name: project.name,
        exportedAt: new Date().toISOString(),
        assets: assetsWithVersions
    };

    archive.append(JSON.stringify(exportData, null, EXPORT_CONFIG.JSON_TAB_SPACE), { name: EXPORT_CONFIG.DATA_FILE_NAME });

    const processAssets = async () => {
        for (const asset of assetsWithVersions) {
            if (!asset.latestVersion) continue;

            const buffer = await storageService.get(asset.latestVersion.hash);
            let pipeline = sharp(buffer);

            if (asset.latestVersion.width || asset.latestVersion.height) {
                pipeline = pipeline.resize({
                    width: asset.latestVersion.width || undefined,
                    height: asset.latestVersion.height || undefined,
                    fit: (asset.latestVersion.params as any)?.fit || AssetFit.COVER
                });
            }

            if (asset.latestVersion.format) {
                pipeline = pipeline.toFormat(asset.latestVersion.format as any);
            }

            const processedBuffer = await pipeline.toBuffer();
            const extension = asset.latestVersion.format;
            archive.append(processedBuffer, { name: `assets/${asset.name}.${extension}` });
        }
    };

    processAssets().then(() => {
        archive.finalize();
    }).catch(err => {
        archive.emit('error', err);
    });

    return { archive, projectName: project.name };
};

export const importProject = async (userId: string, buffer: Buffer) => {
    let zip: AdmZip;

    try {
        zip = new AdmZip(buffer);
    } catch {
        throw new BadRequestError('Invalid zip file');
    }

    const dataEntry = zip.getEntry('data.json');

    if (!dataEntry) {
        throw new BadRequestError('Missing data.json in zip file');
    }

    let exportData: { name: string; assets: any[] };

    try {
        exportData = JSON.parse(dataEntry.getData().toString('utf-8'));
    } catch {
        throw new BadRequestError('Invalid data.json in zip file');
    }

    if (!exportData.name || typeof exportData.name !== 'string' || !Array.isArray(exportData.assets)) {
        throw new BadRequestError('Invalid data.json structure: missing name or assets');
    }

    const project = await createProject({ name: exportData.name, userId });

    const importedAssets = [];

    for (const asset of exportData.assets) {
        const version = asset.latestVersion;

        if (!version || !version.format) {
            throw new BadRequestError(`Asset "${asset.name}" is missing version information`);
        }

        const entryName = `assets/${asset.name}.${version.format}`;
        const entry = zip.getEntry(entryName);

        if (!entry) {
            throw new BadRequestError(`Asset file not found in zip: ${entryName}`);
        }

        const assetBuffer = entry.getData();
        const hash = await storageService.save(assetBuffer);

        const [assetRecord] = await db.insert(assets)
            .values({
                name: asset.name,
                userId,
                projectId: project.id,
            })
            .returning();

        const [versionRecord] = await db.insert(assetVersions)
            .values({
                assetId: assetRecord.id,
                hash,
                size: version.size || assetBuffer.length,
                format: version.format || 'unknown',
                width: version.width ?? undefined,
                height: version.height ?? undefined,
                params: version.params ?? undefined,
            })
            .returning();

        importedAssets.push({ ...assetRecord, latestVersion: versionRecord });
    }

    logger.log({
        timestamp: new Date().toISOString(),
        level: LogLevel.INFO,
        message: `Project imported: ${project.id} with ${importedAssets.length} assets`,
        userId,
        environment: config.env,
        traceId: 'system',
    });

    return { project, assets: importedAssets };
};
