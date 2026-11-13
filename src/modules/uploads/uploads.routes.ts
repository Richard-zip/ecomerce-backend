import { Router } from 'express';
import { UploadsController } from './uploads.controller';
import { upload } from '../../middlewares/upload.middleware';
import { authenticate } from '../../middlewares/auth.middleware';

const router = Router();
const controller = new UploadsController();

// Subir una sola imagen (campo 'image')
router.post('/single', authenticate, upload.single('image'), controller.uploadSingle);

// Subir múltiples imágenes (campo 'images', hasta 5)
router.post('/multiple', authenticate, upload.array('images', 5), controller.uploadMultiple);

export default router;
