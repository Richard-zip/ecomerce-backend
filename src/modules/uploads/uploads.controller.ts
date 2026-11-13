import { Request, Response, NextFunction } from 'express';
import { UploadsService } from './uploads.service';
import { AppError } from '../../middlewares/error.middleware';

const uploadsService = new UploadsService();

export class UploadsController {
  async uploadSingle(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        throw new AppError('Por favor adjunta una imagen en el campo "image".', 400);
      }

      const folder = (req.query.folder as string) || 'products';
      const result = await uploadsService.uploadSingle(req.file, folder);

      res.status(201).json({
        success: true,
        message: 'Imagen subida exitosamente a Vercel Blob.',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async uploadMultiple(req: Request, res: Response, next: NextFunction) {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        throw new AppError('Por favor adjunta al menos una imagen en el campo "images".', 400);
      }

      const folder = (req.query.folder as string) || 'products';
      const results = await uploadsService.uploadMultiple(files, folder);

      res.status(201).json({
        success: true,
        message: `${results.length} imagen(es) subida(s) exitosamente a Vercel Blob.`,
        data: results,
      });
    } catch (error) {
      next(error);
    }
  }
}
