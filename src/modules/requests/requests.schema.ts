import { z } from 'zod';
import { RequestStatus } from '@prisma/client';

export const createRequestSchema = z.object({
  title: z.string().min(3, 'El título debe tener al menos 3 caracteres').max(120, 'Máximo 120 caracteres'),
  description: z.string().min(10, 'La descripción debe tener al menos 10 caracteres').max(1000, 'Máximo 1000 caracteres'),
  maxBudget: z.number().positive('El presupuesto debe ser mayor a 0').optional().nullable(),
  career: z.string().max(80).optional().nullable(),
  campus: z.string().max(80).optional().default('Centro Tutorial Cereté'),
});

export const updateRequestStatusSchema = z.object({
  status: z.nativeEnum(RequestStatus, {
    errorMap: () => ({ message: 'Estado inválido (OPEN, RESOLVED, CLOSED)' }),
  }),
});

export const createOfferSchema = z.object({
  message: z.string().min(5, 'El mensaje debe tener al menos 5 caracteres').max(500, 'Máximo 500 caracteres'),
  price: z.number().positive('El precio debe ser mayor a 0').optional().nullable(),
  productId: z.string().uuid('ID de producto inválido').optional().nullable(),
});

export type CreateRequestInput = z.infer<typeof createRequestSchema>;
export type UpdateRequestStatusInput = z.infer<typeof updateRequestStatusSchema>;
export type CreateOfferInput = z.infer<typeof createOfferSchema>;
