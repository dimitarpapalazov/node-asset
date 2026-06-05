import { Request, Response } from 'express';
import * as assetService from '../services/asset.service.js';
import * as projectService from '../services/project.service.js';
import { HttpStatus } from '../constants/constants.js';
import { NotFoundError, InvalidParamError } from '../utils/errors.js';
import { logger } from '../services/logger/logger.factory.js';
import { LogLevel } from '../services/logger/index.js';
import { config } from '../config/config.js';
import { ValidatedRequest } from '../types/validation.js';
import {
    UploadAssetData,
    ManipulateAssetData,
    GetAssetData,
    GetAssetsByProjectData,
    GetAssetVersionsData,
    DeleteAssetData,
    GenerateAssetKeyData,
    GetPublicAssetData
} from '../schemas/asset.schema.js';

export const uploadAsset = async (req: ValidatedRequest<UploadAssetData>, res: Response): Promise<void> => {
    const { projectId, name } = req.validData.body;
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
};

export const manipulateAsset = async (req: ValidatedRequest<ManipulateAssetData>, res: Response): Promise<void> => {
    const { assetId, versionId } = req.validData.params;
    const options = req.validData.body;
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
};

export const getAsset = async (req: ValidatedRequest<GetAssetData>, res: Response): Promise<void> => {
    const { id } = req.validData.params;
    const userId = req.user!.userId;

    // Authorize: Check if asset belongs to user
    const asset = await assetService.getAssetByIdAndUserId(id, userId);

    if (!asset) {
        throw new NotFoundError(`Asset with id ${id} not found.`);
    }

    const latestVersion = await assetService.getLatestVersion(id);

    res.status(HttpStatus.OK).json({ ...asset, latestVersion });
};

export const getAssetsByProject = async (req: ValidatedRequest<GetAssetsByProjectData>, res: Response): Promise<void> => {
    const { projectId } = req.validData.params;
    const userId = req.user!.userId;

    // Authorize: Check if project belongs to user
    const project = await projectService.getProjectByIdAndUserId(projectId, userId);

    if (!project) throw new NotFoundError('Project not found or unauthorized');

    const assets = await assetService.getAssetsByProjectId(projectId);

    res.status(HttpStatus.OK).json(assets);
};

export const getAssetVersions = async (req: ValidatedRequest<GetAssetVersionsData>, res: Response): Promise<void> => {
    const { id } = req.validData.params;
    const userId = req.user!.userId;

    // Authorize: Check if asset belongs to user
    const asset = await assetService.getAssetByIdAndUserId(id, userId);

    if (!asset) throw new NotFoundError(`Asset with id ${id} not found.`);

    const versions = await assetService.getAllVersions(id);

    res.status(HttpStatus.OK).json(versions);
};

export const deleteAsset = async (req: ValidatedRequest<DeleteAssetData>, res: Response): Promise<void> => {
    const { id } = req.validData.params;
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
};

export const generateAssetKey = async (req: ValidatedRequest<GenerateAssetKeyData>, res: Response): Promise<void> => {
    const { id } = req.validData.params;
    const { expiresInSeconds } = req.validData.body;
    const userId = req.user!.userId;

    // Authorize: Check if asset belongs to user
    const asset = await assetService.getAssetByIdAndUserId(id, userId);

    if (!asset) throw new NotFoundError(`Asset with id ${id} not found.`);

    const assetKey = await assetService.generateAssetKey(id, expiresInSeconds);

    res.status(HttpStatus.CREATED).json(assetKey);
};

export const getPublicAsset = async (req: ValidatedRequest<GetPublicAssetData>, res: Response): Promise<void> => {
    const { key } = req.validData.params;

    const { buffer, format } = await assetService.getLatestAssetVersionByKey(key);

    res.setHeader('Content-Type', `image/${format}`);
    res.status(HttpStatus.OK).send(buffer);
};

