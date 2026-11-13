import { put } from '@vercel/blob';
import { config } from '../../config/env';
import { AppError } from '../../middlewares/error.middleware';

export class UploadsService {
  async uploadSingle(file: Express.Multer.File, folder = 'products') {
    if (!config.blobToken) {
      throw new AppError('El token de Vercel Blob no está configurado en las variables de entorno.', 500);
    }

    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const sanitizedOriginalName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const pathname = `${folder}/${uniqueSuffix}-${sanitizedOriginalName}`;

    const blob = await put(pathname, file.buffer, {
      access: 'public',
      token: config.blobToken,
      contentType: file.mimetype,
    });

    return {
      url: blob.url,
      downloadUrl: blob.downloadUrl,
      pathname: blob.pathname,
      contentType: blob.contentType,
    };
  }

  async uploadMultiple(files: Express.Multer.File[], folder = 'products') {
    return Promise.all(files.map((file) => this.uploadSingle(file, folder)));
  }
}
