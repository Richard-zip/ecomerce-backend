import { z } from 'zod';
import { Role } from '@prisma/client';

export const registerSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Debe ser un correo electrónico válido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  role: z.nativeEnum(Role, {
    errorMap: () => ({ message: 'El rol debe ser CLIENTE o VENDEDOR' }),
  }).default(Role.CLIENTE),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  career: z.string().optional(),
  campus: z.string().optional(),
  avatar: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Debe ser un correo electrónico válido'),
  password: z.string().min(1, 'La contraseña es requerida'),
  role: z.nativeEnum(Role, {
    errorMap: () => ({ message: 'El rol debe ser CLIENTE o VENDEDOR' }),
  }).optional(),
});

export const switchRoleSchema = z.object({
  targetRole: z.nativeEnum(Role, {
    errorMap: () => ({ message: 'El rol de destino debe ser CLIENTE o VENDEDOR' }),
  }),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Debe ser un correo electrónico válido'),
  role: z.nativeEnum(Role, {
    errorMap: () => ({ message: 'El rol debe ser CLIENTE o VENDEDOR' }),
  }).optional(),
});

export const resetPasswordSchema = z.object({
  email: z.string().email('Debe ser un correo electrónico válido'),
  code: z.string().length(6, 'El código debe ser de 6 dígitos'),
  newPassword: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  role: z.nativeEnum(Role, {
    errorMap: () => ({ message: 'El rol debe ser CLIENTE o VENDEDOR' }),
  }).optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type SwitchRoleInput = z.infer<typeof switchRoleSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
