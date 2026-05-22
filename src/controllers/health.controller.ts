import { Request, Response } from 'express';
import * as healthService from '../services/health.service.js';

export const checkHealth = (req: Request, res: Response): void => {
    const status = healthService.getHealthStatus();

    res.status(200).json(status);
};
