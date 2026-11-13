import { Router } from 'express';
import { UsersController } from './users.controller';
import { authenticate } from '../../middlewares/auth.middleware';

const router = Router();
const controller = new UsersController();

// Perfil público de un vendedor
router.get('/sellers/:id', controller.getSellerProfile);

// Actualizar perfil propio
router.put('/profile', authenticate, controller.updateProfile);

export default router;
