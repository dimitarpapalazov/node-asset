import { db } from '../db/index.js';
import { projects, assets } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';
import archiver from 'archiver';
import sharp from 'sharp';
import * as assetService from './asset.service.js';
import { storageService } from './storage.service.js';
import { EXPORT_CONFIG, AssetFit } from '../constants/constants.js';

export interface CreateProjectInput {
    name: string;
    userId: string;
}

export type Project = typeof projects.$inferSelect;

export const createProject = async (input: CreateProjectInput): Promise<Project> => {
    const [project] = await db.insert(projects)
        .values({
            name: input.name,
            userId: input.userId,
        })
        .returning();

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

    return project;
};

export const deleteProject = async (id: string, userId: string): Promise<void> => {
    await db.delete(projects)
        .where(and(eq(projects.id, id), eq(projects.userId, userId)));
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
