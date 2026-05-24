import { Request, Response } from 'express';
import * as assetService from '../services/asset.service.js';
import { HttpStatus } from '../constants/constants.js';
import { MissingFieldError, NotFoundError } from '../utils/errors.js';

export const uploadAsset = async (req: Request, res: Response): Promise<void> => {
    const { projectId, name } = req.body;
    const file = req.file;

    if (!projectId) throw new MissingFieldError('projectId');
    if (!name) throw new MissingFieldError('name');
    if (!file) throw new MissingFieldError('file');

    const asset = await assetService.uploadAsset(
        req.user!.userId,
        projectId as string,
        name as string,
        file.buffer
    );

    res.status(HttpStatus.CREATED).json(asset);
};

export const manipulateAsset = async (req: Request, res: Response): Promise<void> => {
    const { assetId, versionId } = req.params;
    const options = req.body;

    const newVersion = await assetService.manipulateAsset(assetId as string, versionId as string, options);

    res.status(HttpStatus.CREATED).json(newVersion);
};

export const getAsset = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const asset = await assetService.getAssetById(id as string);

    if (!asset) {
        throw new NotFoundError(`Asset with id ${id} not found.`);
    }

    const latestVersion = await assetService.getLatestVersion(id as string);

    res.status(HttpStatus.OK).json({ ...asset, latestVersion });
};

export const getAssetVersions = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const versions = await assetService.getAllVersions(id as string);

    res.status(HttpStatus.OK).json(versions);
};

export const deleteAsset = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    await assetService.deleteAsset(id as string);

    res.status(HttpStatus.NO_CONTENT).send();
};
