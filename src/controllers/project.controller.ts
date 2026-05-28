import { Request, Response } from 'express';
import * as projectService from '../services/project.service.js';
import { HttpStatus } from '../constants/constants.js';
import { getRequiredParam, validateRequiredFields } from '../utils/params.js';
import { AppError } from '../utils/errors.js';
import { logger } from '../services/logger/logger.factory.js';
import { LogLevel } from '../services/logger/index.js';
import { config } from '../config/config.js';

export const createProject = async (req: Request, res: Response): Promise<void> => {
    try {
        validateRequiredFields(req.body, ['name']);
        const { name } = req.body;
        const userId = req.user!.userId; // Assumes auth middleware populates req.user

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
        handleError(req, res, error, 'Error creating project');
    }
};

export const getUserProjects = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user!.userId;
        const projects = await projectService.getUserProjects(userId);
        res.status(HttpStatus.OK).json(projects);
    } catch (error) {
        handleError(req, res, error, 'Error retrieving projects');
    }
};

export const getProject = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = getRequiredParam(req, 'id');
        const userId = req.user!.userId;
        const project = await projectService.getProjectByIdAndUserId(id, userId);

        if (!project) {
            logger.log({
                timestamp: new Date().toISOString(),
                level: LogLevel.WARN,
                message: `Project not found or unauthorized: ${id}`,
                userId,
                traceId: req.traceId,
                environment: config.env,
            });

            res.status(HttpStatus.NOT_FOUND).json({ message: 'Project not found or unauthorized' });
            return;
        }

        res.status(HttpStatus.OK).json(project);
    } catch (error) {
        handleError(req, res, error, 'Error retrieving project');
    }
};

export const updateProject = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = getRequiredParam(req, 'id');
        validateRequiredFields(req.body, ['name']);
        const { name } = req.body;
        const userId = req.user!.userId;

        const project = await projectService.updateProject(id, userId, name);

        if (!project) {
            logger.log({
                timestamp: new Date().toISOString(),
                level: LogLevel.WARN,
                message: `Project not found or unauthorized for update: ${id}`,
                userId,
                traceId: req.traceId,
                environment: config.env,
            });

            res.status(HttpStatus.NOT_FOUND).json({ message: 'Project not found or unauthorized' });
            return;
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
        handleError(req, res, error, 'Error updating project');
    }
};

export const deleteProject = async (req: Request, res: Response): Promise<void> => {
    try {
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
    } catch (error) {
        handleError(req, res, error, 'Error deleting project');
    }
};

export const exportProject = async (req: Request, res: Response): Promise<void> => {
    try {
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

    } catch (error) {
        handleError(req, res, error, 'Error exporting project');
    }
};

/**
 * Common error handler for project controller.
 */
function handleError(req: Request, res: Response, error: unknown, fallbackMessage: string): void {
    const message = error instanceof Error ? error.message : fallbackMessage;
    const statusCode = error instanceof AppError ? error.statusCode : HttpStatus.INTERNAL_SERVER_ERROR;

    logger.log({
        timestamp: new Date().toISOString(),
        level: statusCode >= 500 ? LogLevel.ERROR : LogLevel.WARN,
        message: `${fallbackMessage}: ${message}`,
        userId: req.user?.userId,
        traceId: req.traceId,
        environment: config.env,
        error: error instanceof Error ? error.stack : error,
    });

    res.status(statusCode).json({ message });
}
