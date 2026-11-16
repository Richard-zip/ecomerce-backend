import { prisma } from '../../config/prisma';
import { AppError } from '../../middlewares/error.middleware';
import { CreateRequestInput, CreateOfferInput } from './requests.schema';
import { RequestStatus } from '@prisma/client';

export class RequestsService {
  async getRequests(filters: {
    status?: RequestStatus;
    career?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(50, Math.max(1, filters.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.career && filters.career !== 'all') {
      where.career = { contains: filters.career, mode: 'insensitive' };
    }

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [total, requests] = await Promise.all([
      prisma.studentRequest.count({ where }),
      prisma.studentRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
              career: true,
              campus: true,
              role: true,
            },
          },
          offers: {
            orderBy: { createdAt: 'desc' },
            include: {
              seller: {
                select: {
                  id: true,
                  name: true,
                  avatar: true,
                  phone: true,
                  whatsapp: true,
                  career: true,
                },
              },
              product: {
                select: {
                  id: true,
                  title: true,
                  price: true,
                  images: true,
                  status: true,
                },
              },
            },
          },
          _count: {
            select: { offers: true },
          },
        },
      }),
    ]);

    return {
      requests,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getRequestById(id: string) {
    const request = await prisma.studentRequest.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
            phone: true,
            whatsapp: true,
            career: true,
            campus: true,
          },
        },
        offers: {
          orderBy: { createdAt: 'desc' },
          include: {
            seller: {
              select: {
                id: true,
                name: true,
                avatar: true,
                phone: true,
                whatsapp: true,
                career: true,
              },
            },
            product: {
              select: {
                id: true,
                title: true,
                price: true,
                images: true,
                status: true,
              },
            },
          },
        },
      },
    });

    if (!request) {
      throw new AppError('Petición no encontrada.', 404);
    }

    return request;
  }

  async getMyRequests(userId: string) {
    return prisma.studentRequest.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { offers: true },
        },
        offers: {
          take: 3,
          orderBy: { createdAt: 'desc' },
          include: {
            seller: {
              select: {
                id: true,
                name: true,
                avatar: true,
                phone: true,
                whatsapp: true,
              },
            },
          },
        },
      },
    });
  }

  async createRequest(userId: string, data: CreateRequestInput) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new AppError('Usuario no encontrado.', 404);
    }

    const request = await prisma.studentRequest.create({
      data: {
        userId,
        title: data.title.trim(),
        description: data.description.trim(),
        maxBudget: data.maxBudget || null,
        career: data.career?.trim() || user.career || null,
        campus: data.campus?.trim() || user.campus || 'Centro Tutorial Cereté',
        status: RequestStatus.OPEN,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
            career: true,
          },
        },
      },
    });

    return request;
  }

  async updateRequestStatus(requestId: string, userId: string, status: RequestStatus) {
    const existing = await prisma.studentRequest.findUnique({
      where: { id: requestId },
    });

    if (!existing) {
      throw new AppError('Petición no encontrada.', 404);
    }

    if (existing.userId !== userId) {
      throw new AppError('No tienes permisos para modificar el estado de esta petición.', 403);
    }

    return prisma.studentRequest.update({
      where: { id: requestId },
      data: { status },
      include: {
        user: {
          select: { id: true, name: true, avatar: true },
        },
      },
    });
  }

  async deleteRequest(requestId: string, userId: string) {
    const existing = await prisma.studentRequest.findUnique({
      where: { id: requestId },
    });

    if (!existing) {
      throw new AppError('Petición no encontrada.', 404);
    }

    if (existing.userId !== userId) {
      throw new AppError('No tienes permisos para eliminar esta petición.', 403);
    }

    await prisma.studentRequest.delete({
      where: { id: requestId },
    });

    return { message: 'Petición eliminada con éxito.' };
  }

  async createOffer(requestId: string, sellerId: string, data: CreateOfferInput) {
    const request = await prisma.studentRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new AppError('La petición no existe.', 404);
    }

    if (request.status !== RequestStatus.OPEN) {
      throw new AppError('Esta petición ya ha sido cerrada o resuelta.', 400);
    }

    if (request.userId === sellerId) {
      throw new AppError('No puedes hacer ofertas a tus propias peticiones.', 400);
    }

    // Si se vinculó un producto, verificar que pertenezca al usuario oferente
    if (data.productId) {
      const product = await prisma.product.findUnique({
        where: { id: data.productId },
      });
      if (!product) {
        throw new AppError('El producto vinculado no existe.', 404);
      }
      if (product.sellerId !== sellerId) {
        throw new AppError('Solo puedes vincular productos de tu propio catálogo.', 403);
      }
    }

    const offer = await prisma.requestOffer.create({
      data: {
        requestId,
        sellerId,
        message: data.message.trim(),
        price: data.price || null,
        productId: data.productId || null,
      },
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            avatar: true,
            phone: true,
            whatsapp: true,
            career: true,
          },
        },
        product: {
          select: {
            id: true,
            title: true,
            price: true,
            images: true,
            status: true,
          },
        },
      },
    });

    return offer;
  }

  async deleteOffer(offerId: string, sellerId: string) {
    const offer = await prisma.requestOffer.findUnique({
      where: { id: offerId },
    });

    if (!offer) {
      throw new AppError('Oferta no encontrada.', 404);
    }

    if (offer.sellerId !== sellerId) {
      throw new AppError('No tienes permiso para eliminar esta oferta.', 403);
    }

    await prisma.requestOffer.delete({
      where: { id: offerId },
    });

    return { message: 'Oferta eliminada exitosamente.' };
  }
}
