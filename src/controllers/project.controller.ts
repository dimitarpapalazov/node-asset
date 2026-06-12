import { Request, Response } from 'express';
import * as projectService from '../services/project.service.js';
import { storageService } from '../services/storage.service.js';
import { HttpStatus, ExportStatus } from '../constants/constants.js';
import { NotFoundError, BadRequestError, InvalidParamError } from '../utils/errors.js';
import { logger } from '../services/logger/logger.factory.js';
import { LogLevel } from '../services/logger/index.js';
import { config } from '../config/config.js';
import { ValidatedRequest } from '../types/validation.js';
import {
    CreateProjectData,
    GetProjectData,
    UpdateProjectData,
    DeleteProjectData,
    ExportProjectData,
    GetExportJobStatusData,
    DownloadExportData,
    ImportProjectData
} from '../schemas/project.schema.js';

export const createProject = async (req: ValidatedRequest<CreateProjectData>, res: Response): Promise<void> => {
    const { name } = req.validData.body;
    const userId = req.user!.userId;

    const project = await projectService.createProject({ name, userId });

    logger.log({
        timestamp: new Date().toISOString(),
        level: LogLevel.INFO,
        message: `Project created: ${project.id}`,
        userId,
        traceId: req.traceId,
        environment: config.env,
    });

    res.status(HttpStatus.CREATED).json(project);
};

export const getUserProjects = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.userId;
    const projects = await projectService.getUserProjects(userId);
    res.status(HttpStatus.OK).json(projects);
};

export const getProject = async (req: ValidatedRequest<GetProjectData>, res: Response): Promise<void> => {
    const { id } = req.validData.params;
    const userId = req.user!.userId;
    const project = await projectService.getProjectByIdAndUserId(id, userId);

    if (!project) {
        throw new NotFoundError(`Project with ID ${id} not found or unauthorized`);
    }

    res.status(HttpStatus.OK).json(project);
};

export const updateProject = async (req: ValidatedRequest<UpdateProjectData>, res: Response): Promise<void> => {
    const { id } = req.validData.params;
    const { name } = req.validData.body;
    const userId = req.user!.userId;

    const project = await projectService.updateProject(id, userId, name);

    if (!project) {
        throw new NotFoundError(`Project with ID ${id} not found or unauthorized`);
    }

    logger.log({
        timestamp: new Date().toISOString(),
        level: LogLevel.INFO,
        message: `Project updated: ${id}`,
        userId,
        traceId: req.traceId,
        environment: config.env,
    });

    res.status(HttpStatus.OK).json(project);
};

export const deleteProject = async (req: ValidatedRequest<DeleteProjectData>, res: Response): Promise<void> => {
    const { id } = req.validData.params;
    const userId = req.user!.userId;
    await projectService.deleteProject(id, userId);

    logger.log({
        timestamp: new Date().toISOString(),
        level: LogLevel.INFO,
        message: `Project deleted: ${id}`,
        userId,
        traceId: req.traceId,
        environment: config.env,
    });

    res.status(HttpStatus.NO_CONTENT).send();
};

export const initiateExport = async (req: ValidatedRequest<ExportProjectData>, res: Response): Promise<void> => {
    const { id } = req.validData.params;
    const userId = req.user!.userId;

    const jobId = await projectService.initiateExport(id, userId);

    res.status(HttpStatus.ACCEPTED).json({ jobId });
};

export const getExportJobStatus = async (req: ValidatedRequest<GetExportJobStatusData>, res: Response): Promise<void> => {
    const { jobId } = req.validData.params;
    const userId = req.user!.userId;

    const job = await projectService.getExportJobStatus(jobId, userId);

    if (!job) {
        throw new NotFoundError(`Export job with ID ${jobId} not found or unauthorized`);
    }

    res.status(HttpStatus.OK).json(job);
};

export const downloadExport = async (req: ValidatedRequest<DownloadExportData>, res: Response): Promise<void> => {
    const { jobId } = req.validData.params;
    const userId = req.user!.userId;

    const job = await projectService.getExportJobStatus(jobId, userId);

    if (!job) {
        throw new NotFoundError(`Export job with ID ${jobId} not found or unauthorized`);
    }

    if (job.status !== ExportStatus.COMPLETED || !job.zipHash) {
        throw new BadRequestError(`Export job is not completed or has no result. Current status: ${job.status}`);
    }

    const project = await projectService.getProjectById(job.projectId);

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${project?.name || 'project'}-export.zip"`);

    const stream = storageService.getStream(job.zipHash);
    stream.pipe(res);

    stream.on('error', (err) => {
        logger.log({
            timestamp: new Date().toISOString(),
            level: LogLevel.ERROR,
            message: `Error during export download: ${jobId}`,
            userId,
            traceId: req.traceId,
            environment: config.env,
            error: err.stack || err.message,
        });

        if (!res.headersSent) {
            res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Error during export download' });
        }
    });
};

export const exportProject = async (req: ValidatedRequest<ExportProjectData>, res: Response): Promise<void> => {
    const { id } = req.validData.params;
    const userId = req.user!.userId;
    const { archive, projectName } = await projectService.exportProject(id, userId);

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${projectName}.zip"`);

    archive.pipe(res);

    archive.on('error', (err) => {
        logger.log({
            timestamp: new Date().toISOString(),
            level: LogLevel.ERROR,
            message: `Error during project export: ${id}`,
            userId,
            traceId: req.traceId,
            environment: config.env,
            error: err.stack || err.message,
        });

        if (!res.headersSent) {
            res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Error during project export' });
        }
    });

    logger.log({
        timestamp: new Date().toISOString(),
        level: LogLevel.INFO,
        message: `Project export started: ${id}`,
        userId,
        traceId: req.traceId,
        environment: config.env,
    });
};

export const importProject = async (req: ValidatedRequest<ImportProjectData>, res: Response): Promise<void> => {
    const file = req.file;

    if (!file) {
        throw new InvalidParamError('Required field "file" is missing from request.');
    }

    const userId = req.user!.userId;
    const result = await projectService.importProject(userId, file.buffer);

    logger.log({
        timestamp: new Date().toISOString(),
        level: LogLevel.INFO,
        message: `Project imported: ${result.project.id} with ${result.assets.length} assets`,
        userId,
        traceId: req.traceId,
        environment: config.env,
    });

    res.status(HttpStatus.CREATED).json(result);
};
