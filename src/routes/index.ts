import { Router } from 'express';
import authRoutes from '../modules/auth/auth.routes';
import productsRoutes from '../modules/products/products.routes';
import categoriesRoutes from '../modules/categories/categories.routes';
import ordersRoutes from '../modules/orders/orders.routes';
import uploadsRoutes from '../modules/uploads/uploads.routes';
import usersRoutes from '../modules/users/users.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/products', productsRoutes);
router.use('/categories', categoriesRoutes);
router.use('/orders', ordersRoutes);
router.use('/upload', uploadsRoutes);
router.use('/users', usersRoutes);

export default router;
