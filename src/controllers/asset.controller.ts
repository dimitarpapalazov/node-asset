import { Request, Response } from 'express';
import * as assetService from '../services/asset.service.js';
import { HttpStatus } from '../constants/constants.js';
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
    const options = req.body;

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
