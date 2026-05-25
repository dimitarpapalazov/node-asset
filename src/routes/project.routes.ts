import { Router } from 'express';
import * as projectController from '../controllers/project.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.post('/', projectController.createProject);
router.get('/', projectController.getUserProjects);
router.get('/:id', projectController.getProject);
router.put('/:id', projectController.updateProject);
router.delete('/:id', projectController.deleteProject);
router.get('/:id/export', projectController.exportProject);

export default router;
