import { Router } from 'express';
import { OrdersController } from './orders.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { authorizeRole } from '../../middlewares/role.middleware';
import { Role } from '@prisma/client';

const router = Router();
const controller = new OrdersController();

// Todas las rutas de pedidos requieren estar autenticado
router.use(authenticate);

// Rutas de cliente (comprador)
router.post('/', authorizeRole(Role.CLIENTE), controller.createOrder);
router.get('/my/purchases', authorizeRole(Role.CLIENTE), controller.getBuyerOrders);
router.get('/buyer/orders', authorizeRole(Role.CLIENTE), controller.getBuyerOrders);
router.patch('/:id/cancel', authorizeRole(Role.CLIENTE), controller.cancelOrderByBuyer);
router.post('/reviews', authorizeRole(Role.CLIENTE), controller.createReview);

// Rutas de vendedor (definidas antes de /:id para evitar colisiones)
router.get('/my/sales', authorizeRole(Role.VENDEDOR), controller.getSellerOrders);
router.get('/seller', authorizeRole(Role.VENDEDOR), controller.getSellerOrders);
router.get('/seller/orders', authorizeRole(Role.VENDEDOR), controller.getSellerOrders);
router.patch('/:id/status', authorizeRole(Role.VENDEDOR), controller.updateOrderStatus);

// Ver detalle de un pedido (comprador o vendedor involucrado)
router.get('/:id', controller.getOrderById);

export default router;
