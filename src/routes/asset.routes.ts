import { Router } from 'express';
import multer from 'multer';
import * as assetController from '../controllers/asset.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import {
    deleteAssetSchema,
    getAssetSchema,
    getAssetsByProjectSchema,
    getAssetVersionsSchema,
    manipulateAssetSchema,
    uploadAssetSchema,
    generateAssetKeySchema,
    getPublicAssetSchema
} from '../schemas/asset.schema.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Public route - No authentication required
router.get('/public/:key', validate(getPublicAssetSchema), assetController.getPublicAsset);

// All subsequent asset routes require authentication
router.use(authenticate);

// Asset management routes
router.post('/', upload.single('file'), validate(uploadAssetSchema), assetController.uploadAsset);
router.get('/project/:projectId', validate(getAssetsByProjectSchema), assetController.getAssetsByProject);
router.get('/:id', validate(getAssetSchema), assetController.getAsset);
router.get('/:id/versions', validate(getAssetVersionsSchema), assetController.getAssetVersions);
router.post('/:assetId/versions/:versionId/manipulate', validate(manipulateAssetSchema), assetController.manipulateAsset);
router.post('/:id/keys', validate(generateAssetKeySchema), assetController.generateAssetKey);
router.delete('/:id', validate(deleteAssetSchema), assetController.deleteAsset);

export default router;
