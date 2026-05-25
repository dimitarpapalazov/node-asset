import { Request, Response } from 'express';
import * as projectService from '../services/project.service.js';
import { HttpStatus } from '../constants/constants.js';
import { getRequiredParam, validateRequiredFields } from '../utils/params.js';
import { AppError } from '../utils/errors.js';

export const createProject = async (req: Request, res: Response): Promise<void> => {
    try {
        validateRequiredFields(req.body, ['name']);
        const { name } = req.body;
        const userId = req.user!.userId; // Assumes auth middleware populates req.user

        const project = await projectService.createProject({ name, userId });
        res.status(HttpStatus.CREATED).json(project);
    } catch (error) {
        handleError(res, error, 'Error creating project');
    }
};

export const getUserProjects = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user!.userId;
        const projects = await projectService.getUserProjects(userId);
        res.status(HttpStatus.OK).json(projects);
    } catch (error) {
        handleError(res, error, 'Error retrieving projects');
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
            res.status(HttpStatus.NOT_FOUND).json({ message: 'Project not found or unauthorized' });
            return;
        }

        res.status(HttpStatus.OK).json(project);
    } catch (error) {
        handleError(res, error, 'Error updating project');
    }
};

export const deleteProject = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = getRequiredParam(req, 'id');
        const userId = req.user!.userId;
        await projectService.deleteProject(id, userId);
        res.status(HttpStatus.NO_CONTENT).send();
    } catch (error) {
        handleError(res, error, 'Error deleting project');
    }
};

export const exportProject = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = getRequiredParam(req, 'id');
        const { archive, projectName } = await projectService.exportProject(id);

        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename="${projectName}.zip"`);

        archive.pipe(res);

        archive.on('error', (err) => {
            console.error('Error during project export:', err);
            if (!res.headersSent) {
                res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Error during project export' });
            }
        });

    } catch (error) {
        handleError(res, error, 'Error exporting project');
    }
};

function handleError(res: Response, error: unknown, fallbackMessage: string): void {
    if (error instanceof AppError) {
        res.status(error.statusCode).json({ message: error.message });
        return;
    }

    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: error instanceof Error ? error.message : fallbackMessage
    });
}
