import { Router } from 'express';
import { CategoriesController } from './categories.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { authorizeRole } from '../../middlewares/role.middleware';
import { Role } from '@prisma/client';

const router = Router();
const controller = new CategoriesController();

router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.post('/', authenticate, authorizeRole(Role.VENDEDOR), controller.create);

export default router;
