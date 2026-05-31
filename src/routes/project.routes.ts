import { Router } from 'express';
import * as projectController from '../controllers/project.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import {
    createProjectSchema,
    deleteProjectSchema,
    exportProjectSchema,
    getProjectSchema,
    updateProjectSchema
} from '../schemas/project.schema.js';

const router = Router();

router.use(authenticate);

router.post('/', validate(createProjectSchema), projectController.createProject);
router.get('/', projectController.getUserProjects);
router.get('/:id', validate(getProjectSchema), projectController.getProject);
router.put('/:id', validate(updateProjectSchema), projectController.updateProject);
router.delete('/:id', validate(deleteProjectSchema), projectController.deleteProject);
router.get('/:id/export', validate(exportProjectSchema), projectController.exportProject);

export default router;
