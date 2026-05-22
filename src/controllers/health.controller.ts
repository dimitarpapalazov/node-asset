import { Request, Response } from 'express';
import * as healthService from '../services/health.service.js';
import { HttpStatus } from '../constants/constants.js';

export const checkHealth = (req: Request, res: Response): void => {
    const status = healthService.getHealthStatus();

    res.status(HttpStatus.OK).json(status);
};
