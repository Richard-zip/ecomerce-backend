import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../config/prisma';
import { config } from '../../config/env';
import { AppError } from '../../middlewares/error.middleware';
import { RegisterInput, LoginInput, ForgotPasswordInput, ResetPasswordInput } from './auth.schema';
import { Role } from '@prisma/client';
import { mailService } from '../../services/mail.service';

export class AuthService {
  async register(data: RegisterInput) {
    const targetRole = data.role || Role.CLIENTE;
    const normalizedEmail = data.email.toLowerCase().trim();

    // Comprobar si ya existe una cuenta con este correo electrónico único
    const existingUser = await prisma.user.findUnique({
      where: {
        email: normalizedEmail,
      },
    });

    if (existingUser) {
      throw new AppError(
        'Ya existe una cuenta registrada con este correo electrónico. Por favor inicia sesión con tus credenciales o utiliza otro correo.',
        409
      );
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(data.password, salt);

    const user = await prisma.user.create({
      data: {
        name: data.name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        role: targetRole,
        phone: data.phone?.trim() || null,
        whatsapp: data.whatsapp?.trim() || data.phone?.trim() || null,
        career: data.career?.trim() || null,
        campus: data.campus?.trim() || null,
        avatar: data.avatar || null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        whatsapp: true,
        career: true,
        campus: true,
        avatar: true,
        createdAt: true,
      },
    });

    const token = this.generateToken(user.id, user.email, user.role, user.name);

    return { user, token };
  }

  async login(data: LoginInput) {
    const normalizedEmail = data.email.toLowerCase().trim();

    // Búsqueda directa por correo electrónico
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      throw new AppError('No existe una cuenta registrada con este correo electrónico.', 401);
    }

    const isMatch = await bcrypt.compare(data.password, user.password);
    if (!isMatch) {
      throw new AppError('Contraseña incorrecta. Por favor verifica tus credenciales.', 401);
    }

    const token = this.generateToken(user.id, user.email, user.role, user.name);
    const { password, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      token,
    };
  }

  async switchRole(userId: string, targetRole: Role) {
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!currentUser) {
      throw new AppError('Usuario no encontrado.', 404);
    }

    if (currentUser.role === targetRole) {
      const token = this.generateToken(currentUser.id, currentUser.email, currentUser.role, currentUser.name);
      const { password, ...userWithoutPassword } = currentUser;
      return { user: userWithoutPassword, token };
    }

    // Actualizar directamente el rol de la cuenta existente (sin duplicar usuarios ni cuentas)
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role: targetRole },
    });

    const token = this.generateToken(updatedUser.id, updatedUser.email, updatedUser.role, updatedUser.name);
    const { password, ...userWithoutPassword } = updatedUser;

    return {
      user: userWithoutPassword,
      token,
      message: `Has cambiado tu cuenta al modo ${targetRole === Role.VENDEDOR ? 'Vendedor' : 'Comprador'} exitosamente.`,
    };
  }

  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        whatsapp: true,
        career: true,
        campus: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            products: true,
            buyerOrders: true,
            sellerOrders: true,
            reviewsReceived: true,
          },
        },
      },
    });

    if (!user) {
      throw new AppError('Usuario no encontrado.', 404);
    }

    return user;
  }

  async forgotPassword(data: ForgotPasswordInput) {
    const normalizedEmail = data.email.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      throw new AppError(`No se encontró ninguna cuenta registrada con el correo ${normalizedEmail}.`, 404);
    }

    // Generar código numérico de 6 dígitos
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

    await prisma.user.update({
      where: { email: normalizedEmail },
      data: {
        resetToken: code,
        resetTokenExpires: expires,
      },
    });

    // Enviar correo electrónico con la plantilla institucional
    const recipientName = user.name || 'Estudiante';
    await mailService.sendPasswordResetEmail(normalizedEmail, recipientName, code);

    return {
      message: `Código de verificación enviado exitosamente a ${normalizedEmail}.`,
      email: normalizedEmail,
    };
  }

  async resetPassword(data: ResetPasswordInput) {
    const normalizedEmail = data.email.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      throw new AppError('No se encontró ninguna cuenta con este correo electrónico.', 404);
    }

    if (!user.resetToken || user.resetToken !== data.code.trim()) {
      throw new AppError('El código de verificación es inválido o no coincide.', 400);
    }

    if (!user.resetTokenExpires || user.resetTokenExpires < new Date()) {
      throw new AppError('El código de verificación ha expirado. Por favor solicita uno nuevo.', 400);
    }

    // Cifrar la nueva contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(data.newPassword, salt);

    await prisma.user.update({
      where: { email: normalizedEmail },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpires: null,
      },
    });

    return {
      message: 'Tu contraseña ha sido restablecida con éxito. Ya puedes iniciar sesión con tu nueva contraseña.',
    };
  }

  private generateToken(id: string, email: string, role: Role, name: string): string {
    return jwt.sign(
      { id, email, role, name },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn } as jwt.SignOptions
    );
  }
}
