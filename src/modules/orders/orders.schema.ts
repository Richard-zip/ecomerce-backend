import { z } from 'zod';
import { OrderStatus } from '@prisma/client';

export const createOrderSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string().uuid('ID de producto inválido'),
      quantity: z.coerce.number().int().positive('La cantidad debe ser mayor a 0'),
    })
  ).min(1, 'El pedido debe contener al menos un producto'),
  meetingPoint: z.string().optional(),
  notes: z.string().optional(),
});

export const updateOrderStatusSchema = z.object({
  status: z.nativeEnum(OrderStatus, {
    errorMap: () => ({ message: 'Estado inválido (PENDING, CONFIRMED, DELIVERED, CANCELLED)' }),
  }),
});

export const createReviewSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5, 'La calificación debe estar entre 1 y 5 estrellas'),
  comment: z.string().optional(),
  productId: z.string().uuid().optional(),
  sellerId: z.string().uuid('ID de vendedor requerido'),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
export type CreateReviewInput = z.infer<typeof createReviewSchema>;
