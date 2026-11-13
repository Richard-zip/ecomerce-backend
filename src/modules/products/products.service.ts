import { prisma } from '../../config/prisma';
import { AppError } from '../../middlewares/error.middleware';
import { CreateProductInput, UpdateProductInput, ProductQueryInput } from './products.schema';
import { Prisma, ProductStatus } from '@prisma/client';

export class ProductsService {
  async createProduct(sellerId: string, data: CreateProductInput) {
    // Verificar que la categoría existe
    const category = await prisma.category.findUnique({
      where: { id: data.categoryId },
    });

    if (!category) {
      throw new AppError('La categoría especificada no existe.', 404);
    }

    return prisma.product.create({
      data: {
        title: data.title.trim(),
        description: data.description.trim(),
        price: data.price,
        stock: data.stock,
        images: data.images,
        categoryId: data.categoryId,
        condition: data.condition,
        meetingPoint: data.meetingPoint?.trim() || null,
        sellerId,
        status: ProductStatus.AVAILABLE,
      },
      include: {
        category: true,
        seller: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            whatsapp: true,
            career: true,
            campus: true,
            avatar: true,
          },
        },
      },
    });
  }

  async getProducts(filters: ProductQueryInput) {
    const { search, categoryId, condition, minPrice, maxPrice, sellerId, page, limit } = filters;

    const where: Prisma.ProductWhereInput = {
      status: ProductStatus.AVAILABLE,
    };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (categoryId) {
      where.category = {
        OR: [
          { id: categoryId },
          { slug: categoryId },
        ],
      };
    }

    if (condition) {
      where.condition = condition;
    }

    if (sellerId) {
      where.sellerId = sellerId;
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) where.price.gte = minPrice;
      if (maxPrice !== undefined) where.price.lte = maxPrice;
    }

    const skip = (page - 1) * limit;

    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          category: {
            select: { id: true, name: true, slug: true },
          },
          seller: {
            select: {
              id: true,
              name: true,
              phone: true,
              whatsapp: true,
              career: true,
              campus: true,
              avatar: true,
            },
          },
        },
      }),
    ]);

    return {
      products,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getProductById(id: string) {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        seller: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            whatsapp: true,
            career: true,
            campus: true,
            avatar: true,
            createdAt: true,
          },
        },
        reviews: {
          include: {
            buyer: {
              select: { id: true, name: true, avatar: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!product) {
      throw new AppError('Producto no encontrado.', 404);
    }

    return product;
  }

  async updateProduct(id: string, sellerId: string, data: UpdateProductInput) {
    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new AppError('Producto no encontrado.', 404);
    }

    if (product.sellerId !== sellerId) {
      throw new AppError('No tienes permisos para modificar este producto.', 403);
    }

    if (data.categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: data.categoryId },
      });
      if (!category) {
        throw new AppError('La categoría especificada no existe.', 404);
      }
    }

    return prisma.product.update({
      where: { id },
      data: {
        ...(data.title && { title: data.title.trim() }),
        ...(data.description && { description: data.description.trim() }),
        ...(data.price !== undefined && { price: data.price }),
        ...(data.stock !== undefined && { stock: data.stock }),
        ...(data.images && { images: data.images }),
        ...(data.categoryId && { categoryId: data.categoryId }),
        ...(data.condition && { condition: data.condition }),
        ...(data.status && { status: data.status }),
        ...(data.meetingPoint !== undefined && { meetingPoint: data.meetingPoint?.trim() || null }),
      },
      include: {
        category: true,
      },
    });
  }

  async deleteProduct(id: string, sellerId: string) {
    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new AppError('Producto no encontrado.', 404);
    }

    if (product.sellerId !== sellerId) {
      throw new AppError('No tienes permisos para eliminar este producto.', 403);
    }

    await prisma.product.delete({
      where: { id },
    });

    return { message: 'Producto eliminado correctamente.' };
  }

  async getMyProducts(sellerId: string) {
    return prisma.product.findMany({
      where: { sellerId },
      orderBy: { createdAt: 'desc' },
      include: {
        category: {
          select: { id: true, name: true },
        },
        _count: {
          select: { orderItems: true },
        },
      },
    });
  }

  async generateWhatsAppCheckout(
    productId: string,
    options: {
      quantity?: number;
      meetingPoint?: string;
      clientName?: string;
      notes?: string;
    }
  ) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            phone: true,
            whatsapp: true,
            campus: true,
            career: true,
          },
        },
      },
    });

    if (!product) {
      throw new AppError('Producto no encontrado.', 404);
    }

    if (product.status !== ProductStatus.AVAILABLE) {
      throw new AppError('Este producto no se encuentra disponible actualmente.', 400);
    }

    const sellerWhatsapp = product.seller.whatsapp || product.seller.phone;
    if (!sellerWhatsapp) {
      throw new AppError('El vendedor no ha configurado un número de WhatsApp para contactarlo.', 400);
    }

    // Limpiar caracteres no numéricos para formato celular colombiano (57 + 10 dígitos)
    let cleanNumber = sellerWhatsapp.replace(/\D/g, '');
    if (cleanNumber.startsWith('57') && cleanNumber.length === 12) {
      // Ya tiene código de país Colombia
    } else if (cleanNumber.length === 10 && cleanNumber.startsWith('3')) {
      cleanNumber = `57${cleanNumber}`;
    }

    const quantity = Math.max(1, options.quantity || 1);
    const unitPriceFormatted = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(product.price);
    const totalPriceFormatted = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(product.price * quantity);
    const meetingPoint = options.meetingPoint?.trim() || product.meetingPoint || 'Centro Tutorial Cereté';
    const clientName = options.clientName?.trim() || 'Estudiante';

    // Formatear mensaje para WhatsApp
    const lines = [
      `¡Hola ${product.seller.name}! 👋`,
      `Estoy interesado(a) en comprar tu producto en CampusMarket (Centro Tutorial Cereté):`,
      ``,
      `📦 *Producto:* ${product.title}`,
      `💰 *Precio unitario:* ${unitPriceFormatted}`,
      `🔢 *Cantidad:* ${quantity}`,
      `💵 *Total:* ${totalPriceFormatted}`,
      `📍 *Lugar de entrega en Cereté:* ${meetingPoint}`,
      `👤 *Comprador:* ${clientName}`,
    ];

    if (options.notes?.trim()) {
      lines.push(`📝 *Nota adicional:* ${options.notes.trim()}`);
    }

    lines.push(``, `¿Sigue disponible para coordinar la entrega?`);

    const message = lines.join('\n');
    const whatsappUrl = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;

    return {
      whatsappUrl,
      cleanNumber,
      seller: {
        id: product.seller.id,
        name: product.seller.name,
        whatsapp: sellerWhatsapp,
        campus: product.seller.campus,
      },
      product: {
        id: product.id,
        title: product.title,
        price: product.price,
        quantity,
        totalPrice: product.price * quantity,
        images: product.images,
      },
      meetingPoint,
      message,
    };
  }
}
