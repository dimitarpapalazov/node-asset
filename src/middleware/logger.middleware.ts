import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'node:crypto';
import { logger } from '../services/logger/logger.factory.js';
import { LogLevel } from '../services/logger/index.js';
import { config } from '../config/config.js';

export const loggerMiddleware = (req: Request, res: Response, next: NextFunction) => {
    req.traceId = randomUUID();
    
    // Log incoming request
    logger.log({
        timestamp: new Date().toISOString(),
        level: LogLevel.INFO,
        message: `Incoming ${req.method} ${req.url}`,
        userId: req.user?.userId,
        ipAddress: req.ip,
        environment: config.env,
        traceId: req.traceId,
    });
    
    next();
};
