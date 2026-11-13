import { z } from 'zod';
import { ProductCondition, ProductStatus } from '@prisma/client';

export const createProductSchema = z.object({
  title: z.string().min(3, 'El título debe tener al menos 3 caracteres'),
  description: z.string().min(10, 'La descripción debe tener al menos 10 caracteres'),
  price: z.coerce.number().positive('El precio debe ser un número positivo'),
  stock: z.coerce.number().int().min(1, 'El stock mínimo es 1').default(1),
  images: z.array(z.string()).min(1, 'Se requiere al menos una imagen del producto'),
  categoryId: z.string().min(1, 'Categoría requerida'),
  condition: z.nativeEnum(ProductCondition, {
    errorMap: () => ({ message: 'Condición inválida (NUEVO, COMO_NUEVO, USADO_BUENO, USADO_REGULAR)' }),
  }).default(ProductCondition.NUEVO),
  meetingPoint: z.string().optional(),
});

export const updateProductSchema = createProductSchema.partial().extend({
  status: z.nativeEnum(ProductStatus).optional(),
});

export const productQuerySchema = z.object({
  search: z.string().optional(),
  categoryId: z.string().optional(),
  condition: z.nativeEnum(ProductCondition).optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  sellerId: z.string().uuid().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(12),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ProductQueryInput = z.infer<typeof productQuerySchema>;
