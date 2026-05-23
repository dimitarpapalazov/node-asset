import { Router } from 'express';
import * as userController from '../controllers/user.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/:id', userController.getUser);
router.delete('/:id', userController.deleteUser);

export default router;
