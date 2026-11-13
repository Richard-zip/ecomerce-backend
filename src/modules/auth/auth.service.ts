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

    // Permitir crear cuentas de CLIENTE y VENDEDOR con los mismos datos/correo
    const existingUser = await prisma.user.findFirst({
      where: {
        email: normalizedEmail,
        role: targetRole,
      },
    });

    if (existingUser) {
      const roleLabel = targetRole === Role.VENDEDOR ? 'Estudiante Vendedor' : 'Estudiante Comprador';
      throw new AppError(
        `Ya tienes una cuenta registrada como ${roleLabel} con este correo electrónico. Puedes iniciar sesión directamente en esa modalidad.`,
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

    // Si el usuario especificó la modalidad deseada (CLIENTE o VENDEDOR)
    if (data.role) {
      const user = await prisma.user.findFirst({
        where: {
          email: normalizedEmail,
          role: data.role,
        },
      });

      if (!user) {
        const roleLabel = data.role === Role.VENDEDOR ? 'Vendedor' : 'Comprador';
        throw new AppError(
          `No se encontró una cuenta registrada como Estudiante ${roleLabel} con este correo. Puedes crearla con tus mismos datos en la pestaña de registro.`,
          401
        );
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

    // Si no se especificó rol, buscamos todas las cuentas asociadas al correo
    const matchingUsers = await prisma.user.findMany({
      where: { email: normalizedEmail },
    });

    if (matchingUsers.length === 0) {
      throw new AppError('No existe una cuenta registrada con este correo electrónico.', 401);
    }

    // Si solo tiene una cuenta, autenticar directamente
    if (matchingUsers.length === 1) {
      const singleUser = matchingUsers[0];
      const isMatch = await bcrypt.compare(data.password, singleUser.password);
      if (!isMatch) {
        throw new AppError('Contraseña incorrecta. Por favor verifica tus credenciales.', 401);
      }

      const token = this.generateToken(singleUser.id, singleUser.email, singleUser.role, singleUser.name);
      const { password, ...userWithoutPassword } = singleUser;

      return {
        user: userWithoutPassword,
        token,
      };
    }

    // Si tiene ambas cuentas (CLIENTE y VENDEDOR)
    const validUsers: typeof matchingUsers = [];
    for (const u of matchingUsers) {
      const isMatch = await bcrypt.compare(data.password, u.password);
      if (isMatch) validUsers.push(u);
    }

    if (validUsers.length === 0) {
      throw new AppError('Contraseña incorrecta. Por favor verifica tus credenciales.', 401);
    }

    // Si ambas coinciden con la misma contraseña, preferimos la cuenta más reciente o VENDEDOR si existe
    const selectedUser = validUsers.find((u) => u.role === Role.VENDEDOR) || validUsers[0];
    const token = this.generateToken(selectedUser.id, selectedUser.email, selectedUser.role, selectedUser.name);
    const { password, ...userWithoutPassword } = selectedUser;

    return {
      user: userWithoutPassword,
      token,
      availableRoles: validUsers.map((u) => u.role),
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

    // Buscar si ya tiene la cuenta creada para el rol de destino
    let targetUser = await prisma.user.findFirst({
      where: {
        email: currentUser.email,
        role: targetRole,
      },
    });

    // Si aún no tiene cuenta en el rol de destino, se crea automáticamente con sus mismos datos
    if (!targetUser) {
      targetUser = await prisma.user.create({
        data: {
          name: currentUser.name,
          email: currentUser.email,
          password: currentUser.password,
          role: targetRole,
          phone: currentUser.phone,
          whatsapp: currentUser.whatsapp || currentUser.phone,
          career: currentUser.career,
          campus: currentUser.campus,
          avatar: currentUser.avatar,
        },
      });
    }

    const token = this.generateToken(targetUser.id, targetUser.email, targetUser.role, targetUser.name);
    const { password, ...userWithoutPassword } = targetUser;

    return {
      user: userWithoutPassword,
      token,
      message: `Has cambiado al modo ${targetRole === Role.VENDEDOR ? 'Vendedor' : 'Comprador'} exitosamente.`,
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

    // Verificar si el usuario también tiene la cuenta contraparte disponible
    const counterpartRole = user.role === Role.VENDEDOR ? Role.CLIENTE : Role.VENDEDOR;
    const counterpartUser = await prisma.user.findFirst({
      where: {
        email: user.email,
        role: counterpartRole,
      },
      select: { id: true, role: true },
    });

    return {
      ...user,
      hasCounterpartAccount: !!counterpartUser,
      counterpartRole,
    };
  }

  async forgotPassword(data: ForgotPasswordInput) {
    const normalizedEmail = data.email.toLowerCase().trim();

    const users = await prisma.user.findMany({
      where: data.role ? { email: normalizedEmail, role: data.role } : { email: normalizedEmail },
    });

    if (users.length === 0) {
      const roleLabel = data.role ? ` como ${data.role === Role.VENDEDOR ? 'Vendedor' : 'Comprador'}` : '';
      throw new AppError(`No se encontró ninguna cuenta registrada${roleLabel} con el correo ${normalizedEmail}.`, 404);
    }

    // Generar código numérico de 6 dígitos
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

    // Guardar el código y tiempo de expiración en las cuentas encontradas
    await prisma.user.updateMany({
      where: data.role ? { email: normalizedEmail, role: data.role } : { email: normalizedEmail },
      data: {
        resetToken: code,
        resetTokenExpires: expires,
      },
    });

    // Enviar correo electrónico con la plantilla institucional
    const recipientName = users[0].name || 'Estudiante';
    await mailService.sendPasswordResetEmail(normalizedEmail, recipientName, code);

    return {
      message: `Código de verificación enviado exitosamente a ${normalizedEmail}.`,
      email: normalizedEmail,
    };
  }

  async resetPassword(data: ResetPasswordInput) {
    const normalizedEmail = data.email.toLowerCase().trim();

    const users = await prisma.user.findMany({
      where: data.role ? { email: normalizedEmail, role: data.role } : { email: normalizedEmail },
    });

    if (users.length === 0) {
      throw new AppError('No se encontró ninguna cuenta con este correo electrónico.', 404);
    }

    // Verificar si alguna de las cuentas coincide con el código
    const validUser = users.find((u) => u.resetToken === data.code.trim());

    if (!validUser) {
      throw new AppError('El código de verificación es inválido o no coincide.', 400);
    }

    if (!validUser.resetTokenExpires || validUser.resetTokenExpires < new Date()) {
      throw new AppError('El código de verificación ha expirado. Por favor solicita uno nuevo.', 400);
    }

    // Cifrar la nueva contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(data.newPassword, salt);

    // Actualizar la contraseña y limpiar el token de recuperación
    // Si el usuario tiene rol especificado, se actualiza esa cuenta; si no, la que tiene el token
    await prisma.user.updateMany({
      where: data.role
        ? { email: normalizedEmail, role: data.role }
        : { email: normalizedEmail, resetToken: data.code.trim() },
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
