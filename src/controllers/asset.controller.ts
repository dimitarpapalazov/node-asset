import { Request, Response } from 'express';
import * as assetService from '../services/asset.service.js';
import { HttpStatus, AssetFit } from '../constants/constants.js';
import { NotFoundError, InvalidParamError } from '../utils/errors.js';
import { getRequiredParam, validateRequiredFields } from '../utils/params.js';

export const uploadAsset = async (req: Request, res: Response): Promise<void> => {
    validateRequiredFields(req.body, ['projectId', 'name']);
    const { projectId, name } = req.body;
    const file = req.file;

    if (!file) throw new InvalidParamError('Required field "file" is missing from request.');

    const asset = await assetService.uploadAsset(
        req.user!.userId,
        projectId as string,
        name as string,
        file.buffer
    );

    res.status(HttpStatus.CREATED).json(asset);
};

export const manipulateAsset = async (req: Request, res: Response): Promise<void> => {
    const assetId = getRequiredParam(req, 'assetId');
    const versionId = getRequiredParam(req, 'versionId');
    const options = parseManipulationOptions(req.body);

    const newVersion = await assetService.manipulateAsset(assetId, versionId, options);

    res.status(HttpStatus.CREATED).json(newVersion);
};

export const getAsset = async (req: Request, res: Response): Promise<void> => {
    const id = getRequiredParam(req, 'id');
    const asset = await assetService.getAssetById(id);

    if (!asset) {
        throw new NotFoundError(`Asset with id ${id} not found.`);
    }

    const latestVersion = await assetService.getLatestVersion(id);

    res.status(HttpStatus.OK).json({ ...asset, latestVersion });
};

export const getAssetVersions = async (req: Request, res: Response): Promise<void> => {
    const id = getRequiredParam(req, 'id');
    const versions = await assetService.getAllVersions(id);

    res.status(HttpStatus.OK).json(versions);
};

export const deleteAsset = async (req: Request, res: Response): Promise<void> => {
    const id = getRequiredParam(req, 'id');
    await assetService.deleteAsset(id);

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
