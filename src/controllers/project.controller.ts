import { Request, Response } from 'express';
import * as projectService from '../services/project.service.js';
import { HttpStatus } from '../constants/constants.js';
import { NotFoundError } from '../utils/errors.js';
import { logger } from '../services/logger/logger.factory.js';
import { LogLevel } from '../services/logger/index.js';
import { config } from '../config/config.js';
import { createProjectSchema, updateProjectSchema, getProjectSchema, deleteProjectSchema, exportProjectSchema } from '../schemas/project.schema.js';
import { InvalidParamError } from '../utils/errors.js';

export const createProject = async (req: Request, res: Response): Promise<void> => {
    try {
        const validated = await createProjectSchema.parseAsync({
            body: req.body,
        });
        const { name } = validated.body;
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
    } catch (error) {
        if (error instanceof Error && error.name === 'ZodError') {
            throw new InvalidParamError(error.message);
        }
        throw error;
    }
};

export const getUserProjects = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.userId;
    const projects = await projectService.getUserProjects(userId);
    res.status(HttpStatus.OK).json(projects);
};

export const getProject = async (req: Request, res: Response): Promise<void> => {
    try {
        const validated = await getProjectSchema.parseAsync({
            params: req.params,
        });
        const { id } = validated.params;
        const userId = req.user!.userId;
        const project = await projectService.getProjectByIdAndUserId(id, userId);

        if (!project) {
            throw new NotFoundError(`Project with ID ${id} not found or unauthorized`);
        }

        res.status(HttpStatus.OK).json(project);
    } catch (error) {
        if (error instanceof Error && error.name === 'ZodError') {
            throw new InvalidParamError(error.message);
        }
        throw error;
    }
};

export const updateProject = async (req: Request, res: Response): Promise<void> => {
    try {
        const validated = await updateProjectSchema.parseAsync({
            params: req.params,
            body: req.body,
        });
        const { id } = validated.params;
        const { name } = validated.body;
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
    } catch (error) {
        if (error instanceof Error && error.name === 'ZodError') {
            throw new InvalidParamError(error.message);
        }
        throw error;
    }
};

export const deleteProject = async (req: Request, res: Response): Promise<void> => {
    try {
        const validated = await deleteProjectSchema.parseAsync({
            params: req.params,
        });
        const { id } = validated.params;
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
    } catch (error) {
        if (error instanceof Error && error.name === 'ZodError') {
            throw new InvalidParamError(error.message);
        }
        throw error;
    }
};

export const exportProject = async (req: Request, res: Response): Promise<void> => {
    try {
        const validated = await exportProjectSchema.parseAsync({
            params: req.params,
        });
        const { id } = validated.params;
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
    } catch (error) {
        if (error instanceof Error && error.name === 'ZodError') {
            throw new InvalidParamError(error.message);
        }
        throw error;
    }
};
