import { Router } from 'express';
import { ProductsController } from './products.controller';
import { authenticate, optionalAuthenticate } from '../../middlewares/auth.middleware';
import { authorizeRole } from '../../middlewares/role.middleware';
import { Role } from '@prisma/client';

const router = Router();
const controller = new ProductsController();

// Rutas públicas
router.get('/', controller.getProducts);
router.get('/detail/:id', controller.getProductById);

// Endpoint de compra directa por WhatsApp (soporta GET y POST)
router.get('/:id/whatsapp-checkout', optionalAuthenticate, controller.getWhatsAppCheckout);
router.post('/:id/whatsapp-checkout', optionalAuthenticate, controller.getWhatsAppCheckout);
router.get('/:id/buy-whatsapp', optionalAuthenticate, controller.getWhatsAppCheckout);
router.post('/:id/buy-whatsapp', optionalAuthenticate, controller.getWhatsAppCheckout);

// Rutas para vendedores autenticados
router.post('/', authenticate, authorizeRole(Role.VENDEDOR), controller.createProduct);
router.get('/my/products', authenticate, authorizeRole(Role.VENDEDOR), controller.getMyProducts);
router.put('/:id', authenticate, authorizeRole(Role.VENDEDOR), controller.updateProduct);
router.delete('/:id', authenticate, authorizeRole(Role.VENDEDOR), controller.deleteProduct);

// Detalle por ID directo (público, compatible con REST estándar GET /products/:id)
router.get('/:id', controller.getProductById);

export default router;
