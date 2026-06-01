import { Request, Response } from 'express';
import * as assetService from '../services/asset.service.js';
import * as projectService from '../services/project.service.js';
import { HttpStatus } from '../constants/constants.js';
import { NotFoundError, InvalidParamError } from '../utils/errors.js';
import { logger } from '../services/logger/logger.factory.js';
import { LogLevel } from '../services/logger/index.js';
import { config } from '../config/config.js';
import {
    manipulateAssetSchema,
    uploadAssetSchema,
    getAssetSchema,
    getAssetsByProjectSchema,
    getAssetVersionsSchema,
    deleteAssetSchema,
    generateAssetKeySchema,
    getPublicAssetSchema
} from '../schemas/asset.schema.js';

export const uploadAsset = async (req: Request, res: Response): Promise<void> => {
    try {
        const validated = await uploadAssetSchema.parseAsync({
            body: req.body,
        });
        const { projectId, name } = validated.body;
        const file = req.file;
        const userId = req.user!.userId;

        if (!file) throw new InvalidParamError('Required field "file" is missing from request.');

        // Authorize: Check if project belongs to user
        const project = await projectService.getProjectByIdAndUserId(projectId, userId);

        if (!project) throw new NotFoundError('Project not found or unauthorized');

        const asset = await assetService.uploadAsset(
            userId,
            projectId,
            name,
            file.buffer
        );

        logger.log({
            timestamp: new Date().toISOString(),
            level: LogLevel.INFO,
            message: `Asset uploaded: ${asset.id} in project ${projectId}`,
            userId,
            traceId: req.traceId,
            environment: config.env,
        });

        res.status(HttpStatus.CREATED).json(asset);
    } catch (error) {
        if (error instanceof Error && error.name === 'ZodError') {
            throw new InvalidParamError(error.message);
        }
        throw error;
    }
};

export const manipulateAsset = async (req: Request, res: Response): Promise<void> => {
    try {
        const validated = await manipulateAssetSchema.parseAsync({
            params: req.params,
            body: req.body,
        });

        const { assetId, versionId } = validated.params;
        const options = validated.body;
        const userId = req.user!.userId;

        // Authorize: Check if asset belongs to user
        const asset = await assetService.getAssetByIdAndUserId(assetId, userId);

        if (!asset) throw new NotFoundError('Asset not found or unauthorized');

        const newVersion = await assetService.manipulateAsset(assetId, versionId, options);

        logger.log({
            timestamp: new Date().toISOString(),
            level: LogLevel.INFO,
            message: `Asset manipulated: ${assetId}, new version: ${newVersion.id}`,
            userId,
            traceId: req.traceId,
            environment: config.env,
        });

        res.status(HttpStatus.CREATED).json(newVersion);
    } catch (error) {
        if (error instanceof Error && error.name === 'ZodError') {
            throw new InvalidParamError(error.message);
        }
        throw error;
    }
};

export const getAsset = async (req: Request, res: Response): Promise<void> => {
    try {
        const validated = await getAssetSchema.parseAsync({
            params: req.params,
        });
        const { id } = validated.params;
        const userId = req.user!.userId;

        // Authorize: Check if asset belongs to user
        const asset = await assetService.getAssetByIdAndUserId(id, userId);

        if (!asset) {
            throw new NotFoundError(`Asset with id ${id} not found.`);
        }

        const latestVersion = await assetService.getLatestVersion(id);

        res.status(HttpStatus.OK).json({ ...asset, latestVersion });
    } catch (error) {
        if (error instanceof Error && error.name === 'ZodError') {
            throw new InvalidParamError(error.message);
        }
        throw error;
    }
};

export const getAssetsByProject = async (req: Request, res: Response): Promise<void> => {
    try {
        const validated = await getAssetsByProjectSchema.parseAsync({
            params: req.params,
        });
        const { projectId } = validated.params;
        const userId = req.user!.userId;

        // Authorize: Check if project belongs to user
        const project = await projectService.getProjectByIdAndUserId(projectId, userId);

        if (!project) throw new NotFoundError('Project not found or unauthorized');

        const assets = await assetService.getAssetsByProjectId(projectId);

        res.status(HttpStatus.OK).json(assets);
    } catch (error) {
        if (error instanceof Error && error.name === 'ZodError') {
            throw new InvalidParamError(error.message);
        }
        throw error;
    }
};

export const getAssetVersions = async (req: Request, res: Response): Promise<void> => {
    try {
        const validated = await getAssetVersionsSchema.parseAsync({
            params: req.params,
        });
        const { id } = validated.params;
        const userId = req.user!.userId;

        // Authorize: Check if asset belongs to user
        const asset = await assetService.getAssetByIdAndUserId(id, userId);

        if (!asset) throw new NotFoundError(`Asset with id ${id} not found.`);

        const versions = await assetService.getAllVersions(id);

        res.status(HttpStatus.OK).json(versions);
    } catch (error) {
        if (error instanceof Error && error.name === 'ZodError') {
            throw new InvalidParamError(error.message);
        }
        throw error;
    }
};

export const deleteAsset = async (req: Request, res: Response): Promise<void> => {
    try {
        const validated = await deleteAssetSchema.parseAsync({
            params: req.params,
        });
        const { id } = validated.params;
        const userId = req.user!.userId;

        // Authorize: Check if asset belongs to user
        const asset = await assetService.getAssetByIdAndUserId(id, userId);

        if (!asset) throw new NotFoundError(`Asset with id ${id} not found.`);

        await assetService.deleteAsset(id);

        logger.log({
            timestamp: new Date().toISOString(),
            level: LogLevel.INFO,
            message: `Asset deleted: ${id}`,
            userId,
            traceId: req.traceId,
            environment: config.env,
        });

        res.status(HttpStatus.NO_CONTENT).send();
    } catch (error) {
        if (error instanceof Error && error.name === 'ZodError') {
            throw new InvalidParamError(error.message);
        }
        throw error;
    }
};

export const generateAssetKey = async (req: Request, res: Response): Promise<void> => {
    try {
        const validated = await generateAssetKeySchema.parseAsync({
            params: req.params,
            body: req.body,
        });

        const { id } = validated.params;
        const { expiresInSeconds } = validated.body;
        const userId = req.user!.userId;

        // Authorize: Check if asset belongs to user
        const asset = await assetService.getAssetByIdAndUserId(id, userId);

        if (!asset) throw new NotFoundError(`Asset with id ${id} not found.`);

        const assetKey = await assetService.generateAssetKey(id, expiresInSeconds);

        res.status(HttpStatus.CREATED).json(assetKey);
    } catch (error) {
        if (error instanceof Error && error.name === 'ZodError') {
            throw new InvalidParamError(error.message);
        }
        throw error;
    }
};

export const getPublicAsset = async (req: Request, res: Response): Promise<void> => {
    try {
        const validated = await getPublicAssetSchema.parseAsync({
            params: req.params,
        });

        const { key } = validated.params;

        const { buffer, format } = await assetService.getLatestAssetVersionByKey(key);

        res.setHeader('Content-Type', `image/${format}`);
        res.status(HttpStatus.OK).send(buffer);
    } catch (error) {
        if (error instanceof Error && error.name === 'ZodError') {
            throw new InvalidParamError(error.message);
        }
        throw error;
    }
};
