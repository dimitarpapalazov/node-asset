import { Router } from 'express';
import multer from 'multer';
import * as assetController from '../controllers/asset.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// All asset routes require authentication
router.use(authenticate);

// Asset management routes
router.post('/', upload.single('file'), assetController.uploadAsset);
router.get('/:id', assetController.getAsset);
router.get('/:id/versions', assetController.getAssetVersions);
router.post('/:assetId/versions/:versionId/manipulate', assetController.manipulateAsset);
router.delete('/:id', assetController.deleteAsset);

export default router;
