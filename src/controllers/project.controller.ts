import { Request, Response } from 'express';
import * as projectService from '../services/project.service.js';
import { HttpStatus } from '../constants/constants.js';
import { getRequiredParam, validateRequiredFields } from '../utils/params.js';
import { NotFoundError } from '../utils/errors.js';
import { logger } from '../services/logger/logger.factory.js';
import { LogLevel } from '../services/logger/index.js';
import { config } from '../config/config.js';

export const createProject = async (req: Request, res: Response): Promise<void> => {
    validateRequiredFields(req.body, ['name']);
    const { name } = req.body;
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

export const getProject = async (req: Request, res: Response): Promise<void> => {
    const id = getRequiredParam(req, 'id');
    const userId = req.user!.userId;
    const project = await projectService.getProjectByIdAndUserId(id, userId);

    if (!project) {
        throw new NotFoundError(`Project with ID ${id} not found or unauthorized`);
    }

    res.status(HttpStatus.OK).json(project);
};

export const updateProject = async (req: Request, res: Response): Promise<void> => {
    const id = getRequiredParam(req, 'id');
    validateRequiredFields(req.body, ['name']);
    const { name } = req.body;
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

export const deleteProject = async (req: Request, res: Response): Promise<void> => {
    const id = getRequiredParam(req, 'id');
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

export const exportProject = async (req: Request, res: Response): Promise<void> => {
    const id = getRequiredParam(req, 'id');
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
