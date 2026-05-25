import { Router } from 'express';
import { loggerMiddleware } from '../middleware/logger.middleware.js';
import healthRoutes from './health.routes.js';
import userRoutes from './user.routes.js';
import authRoutes from './auth.routes.js';
import projectRoutes from './project.routes.js';
import assetRoutes from './asset.routes.js';

const router = Router();

router.use(loggerMiddleware);

router.use('/health', healthRoutes);
router.use('/users', userRoutes);
router.use('/auth', authRoutes);
router.use('/projects', projectRoutes);
router.use('/assets', assetRoutes);

export default router;
