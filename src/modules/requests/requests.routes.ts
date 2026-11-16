import { Router } from 'express';
import { RequestsController } from './requests.controller';
import { authenticate } from '../../middlewares/auth.middleware';

const router = Router();
const controller = new RequestsController();

// Rutas públicas
router.get('/', controller.getRequests);
router.get('/detail/:id', controller.getRequestById);

// Rutas protegidas (cualquier estudiante autenticado)
router.use(authenticate);

router.get('/my/list', controller.getMyRequests);
router.post('/', controller.createRequest);
router.patch('/:id/status', controller.updateRequestStatus);
router.delete('/:id', controller.deleteRequest);

// Ofertas
router.post('/:id/offers', controller.createOffer);
router.delete('/offers/:offerId', controller.deleteOffer);

export default router;
