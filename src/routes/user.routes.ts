import { Router } from 'express';
import * as userController from '../controllers/user.controller.js';

const router = Router();

router.post('/', userController.createUser);
router.get('/:id', userController.getUser);
router.delete('/:id', userController.deleteUser);

export default router;
