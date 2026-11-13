import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export class AppError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number = 400) {
    super(message);
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (err instanceof ZodError) {
    const formattedErrors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    const mainMessage = formattedErrors[0]?.message || 'Error de validación en los datos enviados.';

    console.warn(`⚠️ [Validación 400] ${req.method} ${req.originalUrl}: ${mainMessage}`);

    res.status(400).json({
      success: false,
      message: mainMessage,
      errors: formattedErrors,
    });
    return;
  }

  if (err instanceof AppError) {
    console.warn(`⚠️ [AppError ${err.statusCode}] ${req.method} ${req.originalUrl}: ${err.message}`);
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
    return;
  }

  // Errores de Prisma conocidos
  if (err.code === 'P2002') {
    res.status(409).json({
      success: false,
      message: 'Ya existe un registro con ese valor único.',
      target: err.meta?.target,
    });
    return;
  }

  if (err.code === 'P2025') {
    res.status(404).json({
      success: false,
      message: 'El registro solicitado no fue encontrado.',
    });
    return;
  }

  console.error('❌ Error no controlado:', err);

  res.status(500).json({
    success: false,
    message: err.message || 'Error interno del servidor.',
  });
};
