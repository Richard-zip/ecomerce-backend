import { prisma } from '../../config/prisma';
import { AppError } from '../../middlewares/error.middleware';
import { Role } from '@prisma/client';

export class UsersService {
  async getSellerPublicProfile(sellerId: string) {
    const seller = await prisma.user.findFirst({
      where: {
        id: sellerId,
        role: Role.VENDEDOR,
      },
      select: {
        id: true,
        name: true,
        career: true,
        campus: true,
        avatar: true,
        phone: true,
        whatsapp: true,
        createdAt: true,
        products: {
          where: { status: 'AVAILABLE' },
          include: {
            category: { select: { id: true, name: true } },
          },
        },
        reviewsReceived: {
          include: {
            buyer: { select: { id: true, name: true, avatar: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!seller) {
      throw new AppError('Vendedor no encontrado.', 404);
    }

    const ratingsCount = seller.reviewsReceived.length;
    const averageRating =
      ratingsCount > 0
        ? seller.reviewsReceived.reduce((acc, r) => acc + r.rating, 0) / ratingsCount
        : null;

    return {
      ...seller,
      stats: {
        totalProducts: seller.products.length,
        totalReviews: ratingsCount,
        averageRating: averageRating ? Number(averageRating.toFixed(1)) : null,
      },
    };
  }

  async updateProfile(userId: string, data: { name?: string; phone?: string; whatsapp?: string; career?: string; campus?: string; avatar?: string }) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.name && { name: data.name.trim() }),
        ...(data.phone !== undefined && { phone: data.phone?.trim() || null }),
        ...(data.whatsapp !== undefined && { whatsapp: data.whatsapp?.trim() || null }),
        ...(data.career !== undefined && { career: data.career?.trim() || null }),
        ...(data.campus !== undefined && { campus: data.campus?.trim() || null }),
        ...(data.avatar !== undefined && { avatar: data.avatar || null }),
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
        updatedAt: true,
      },
    });
  }
}
