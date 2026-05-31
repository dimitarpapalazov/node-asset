import { Request, Response } from 'express';
import * as assetService from '../services/asset.service.js';
import * as projectService from '../services/project.service.js';
import { HttpStatus, AssetFit } from '../constants/constants.js';
import { NotFoundError, InvalidParamError } from '../utils/errors.js';
import { getRequiredParam, validateRequiredFields } from '../utils/params.js';
import { logger } from '../services/logger/logger.factory.js';
import { LogLevel } from '../services/logger/index.js';
import { config } from '../config/config.js';

export const uploadAsset = async (req: Request, res: Response): Promise<void> => {
    validateRequiredFields(req.body, ['projectId', 'name']);
    const { projectId, name } = req.body;
    const file = req.file;
    const userId = req.user!.userId;

    if (!file) throw new InvalidParamError('Required field "file" is missing from request.');

    // Authorize: Check if project belongs to user
    const project = await projectService.getProjectByIdAndUserId(projectId, userId);
    
    if (!project) throw new NotFoundError('Project not found or unauthorized');

    const asset = await assetService.uploadAsset(
        userId,
        projectId as string,
        name as string,
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

export const manipulateAsset = async (req: Request, res: Response): Promise<void> => {
    const assetId = getRequiredParam(req, 'assetId');
    const versionId = getRequiredParam(req, 'versionId');
    const options = parseManipulationOptions(req.body);
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

export const getAsset = async (req: Request, res: Response): Promise<void> => {
    const id = getRequiredParam(req, 'id');
    const userId = req.user!.userId;

    // Authorize: Check if asset belongs to user
    const asset = await assetService.getAssetByIdAndUserId(id, userId);

    if (!asset) {
        throw new NotFoundError(`Asset with id ${id} not found.`);
    }

    const latestVersion = await assetService.getLatestVersion(id);

    res.status(HttpStatus.OK).json({ ...asset, latestVersion });
};

export const getAssetsByProject = async (req: Request, res: Response): Promise<void> => {
    const projectId = getRequiredParam(req, 'projectId');
    const userId = req.user!.userId;

    // Authorize: Check if project belongs to user
    const project = await projectService.getProjectByIdAndUserId(projectId, userId);
    
    if (!project) throw new NotFoundError('Project not found or unauthorized');

    const assets = await assetService.getAssetsByProjectId(projectId);

    res.status(HttpStatus.OK).json(assets);
};

export const getAssetVersions = async (req: Request, res: Response): Promise<void> => {
    const id = getRequiredParam(req, 'id');
    const userId = req.user!.userId;

    // Authorize: Check if asset belongs to user
    const asset = await assetService.getAssetByIdAndUserId(id, userId);
    
    if (!asset) throw new NotFoundError(`Asset with id ${id} not found.`);

    const versions = await assetService.getAllVersions(id);

    res.status(HttpStatus.OK).json(versions);
};

export const deleteAsset = async (req: Request, res: Response): Promise<void> => {
    const id = getRequiredParam(req, 'id');
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

const parseManipulationOptions = (body: any): assetService.ManipulationOptions => {
    const options: assetService.ManipulationOptions = {};

    if (body.width !== undefined) {
        const width = parseInt(body.width, 10);

        if (isNaN(width)) {
            throw new InvalidParamError('Field "width" must be a number.');
        }

        options.width = width;
    }

    if (body.height !== undefined) {
        const height = parseInt(body.height, 10);

        if (isNaN(height)) {
            throw new InvalidParamError('Field "height" must be a number.');
        }

        options.height = height;
    }

    if (body.fit !== undefined) {
        const validFits = Object.values(AssetFit);

        if (!validFits.includes(body.fit as AssetFit)) {
            throw new InvalidParamError(`Field "fit" must be one of: ${validFits.join(', ')}.`);
        }

        options.fit = body.fit as AssetFit;
    }

    if (body.format !== undefined) {
        options.format = body.format as assetService.ManipulationOptions['format'];
    }

    return options;
};
