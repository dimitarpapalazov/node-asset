import { Router } from 'express';
import * as userController from '../controllers/user.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { deleteUserSchema, getUserSchema } from '../schemas/user.schema.js';

const router = Router();

router.use(authenticate);

router.get('/:id', validate(getUserSchema), userController.getUser);
router.delete('/:id', validate(deleteUserSchema), userController.deleteUser);

export default router;
