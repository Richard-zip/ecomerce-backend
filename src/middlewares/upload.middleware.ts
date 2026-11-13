import multer from 'multer';

// Almacenamos en memoria como Buffer para subirlo directamente a Vercel Blob
const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // Máximo 5MB por imagen
    files: 5, // Máximo 5 imágenes simultáneas
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no soportado. Formatos válidos: JPEG, PNG, WEBP, GIF, AVIF.'));
    }
  },
});
