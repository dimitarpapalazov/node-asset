import { Router } from 'express';
import * as projectController from '../controllers/project.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import {
    createProjectSchema,
    deleteProjectSchema,
    exportProjectSchema,
    getProjectSchema,
    updateProjectSchema,
    getExportJobStatusSchema,
    downloadExportSchema
} from '../schemas/project.schema.js';

const router = Router();

router.use(authenticate);

router.post('/', validate(createProjectSchema), projectController.createProject);
router.get('/', projectController.getUserProjects);
router.get('/:id', validate(getProjectSchema), projectController.getProject);
router.put('/:id', validate(updateProjectSchema), projectController.updateProject);
router.delete('/:id', validate(deleteProjectSchema), projectController.deleteProject);

// Export routes
router.post('/:id/export', validate(exportProjectSchema), projectController.initiateExport);
router.get('/export-jobs/:jobId', validate(getExportJobStatusSchema), projectController.getExportJobStatus);
router.get('/export-jobs/:jobId/download', validate(downloadExportSchema), projectController.downloadExport);

// Legacy synchronous export
router.get('/:id/export', validate(exportProjectSchema), projectController.exportProject);

export default router;
