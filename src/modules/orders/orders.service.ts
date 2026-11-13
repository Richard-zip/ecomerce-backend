import { prisma } from '../../config/prisma';
import { AppError } from '../../middlewares/error.middleware';
import { CreateOrderInput, UpdateOrderStatusInput, CreateReviewInput } from './orders.schema';
import { OrderStatus, ProductStatus } from '@prisma/client';

export class OrdersService {
  async createOrder(buyerId: string, data: CreateOrderInput) {
    const productIds = data.items.map((i) => i.productId);

    // Buscar los productos
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    if (products.length !== productIds.length) {
      throw new AppError('Uno o más productos solicitados no existen.', 404);
    }

    // Verificar que todos los productos pertenezcan al mismo vendedor (para facilitar entrega en campus)
    const sellerId = products[0].sellerId;
    const allSameSeller = products.every((p) => p.sellerId === sellerId);
    if (!allSameSeller) {
      throw new AppError('Todos los productos del pedido deben pertenecer al mismo vendedor para coordinar la entrega.', 400);
    }

    if (sellerId === buyerId) {
      throw new AppError('No puedes comprar tus propios productos.', 400);
    }

    // Validar disponibilidad y calcular total
    let totalAmount = 0;
    const orderItemsData: { productId: string; quantity: number; unitPrice: number }[] = [];

    for (const item of data.items) {
      const product = products.find((p) => p.id === item.productId)!;

      if (product.status !== ProductStatus.AVAILABLE) {
        throw new AppError(`El producto "${product.title}" no está disponible para la compra.`, 400);
      }

      if (product.stock < item.quantity) {
        throw new AppError(`Stock insuficiente para "${product.title}". Stock disponible: ${product.stock}`, 400);
      }

      const itemTotal = product.price * item.quantity;
      totalAmount += itemTotal;

      orderItemsData.push({
        productId: product.id,
        quantity: item.quantity,
        unitPrice: product.price,
      });
    }

    // Ejecutar creación del pedido y descuento de stock en transacción
    const order = await prisma.$transaction(async (tx) => {
      const createdOrder = await tx.order.create({
        data: {
          buyerId,
          sellerId,
          totalAmount,
          meetingPoint: data.meetingPoint?.trim() || null,
          notes: data.notes?.trim() || null,
          status: OrderStatus.PENDING,
          items: {
            create: orderItemsData,
          },
        },
        include: {
          items: {
            include: {
              product: {
                select: { id: true, title: true, images: true },
              },
            },
          },
          seller: {
            select: { id: true, name: true, phone: true, email: true, campus: true },
          },
          buyer: {
            select: { id: true, name: true, phone: true, email: true },
          },
        },
      });

      // Actualizar el stock de cada producto
      for (const item of data.items) {
        const product = products.find((p) => p.id === item.productId)!;
        const newStock = product.stock - item.quantity;
        await tx.product.update({
          where: { id: product.id },
          data: {
            stock: newStock,
            status: newStock === 0 ? ProductStatus.SOLD_OUT : ProductStatus.AVAILABLE,
          },
        });
      }

      return createdOrder;
    });

    return order;
  }

  async getBuyerOrders(buyerId: string) {
    return prisma.order.findMany({
      where: { buyerId },
      orderBy: { createdAt: 'desc' },
      include: {
        seller: {
          select: { id: true, name: true, phone: true, email: true, campus: true, avatar: true },
        },
        items: {
          include: {
            product: {
              select: { id: true, title: true, images: true, price: true },
            },
          },
        },
      },
    });
  }

  async getSellerOrders(sellerId: string) {
    return prisma.order.findMany({
      where: { sellerId },
      orderBy: { createdAt: 'desc' },
      include: {
        buyer: {
          select: { id: true, name: true, phone: true, email: true, career: true, campus: true, avatar: true },
        },
        items: {
          include: {
            product: {
              select: { id: true, title: true, images: true, price: true },
            },
          },
        },
      },
    });
  }

  async getOrderById(orderId: string, userId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        buyer: {
          select: { id: true, name: true, phone: true, email: true, career: true, campus: true, avatar: true },
        },
        seller: {
          select: { id: true, name: true, phone: true, email: true, career: true, campus: true, avatar: true },
        },
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order) {
      throw new AppError('Pedido no encontrado.', 404);
    }

    if (order.buyerId !== userId && order.sellerId !== userId) {
      throw new AppError('No tienes permiso para ver este pedido.', 403);
    }

    return order;
  }

  async updateOrderStatus(orderId: string, sellerId: string, data: UpdateOrderStatusInput) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      throw new AppError('Pedido no encontrado.', 404);
    }

    if (order.sellerId !== sellerId) {
      throw new AppError('Solo el vendedor asignado puede actualizar el estado del pedido.', 403);
    }

    // Si se cancela el pedido, restablecer stock
    if (data.status === OrderStatus.CANCELLED && order.status !== OrderStatus.CANCELLED) {
      return prisma.$transaction(async (tx) => {
        for (const item of order.items) {
          const productExists = await tx.product.findUnique({ where: { id: item.productId } });
          if (productExists) {
            await tx.product.update({
              where: { id: item.productId },
              data: {
                stock: { increment: item.quantity },
                status: ProductStatus.AVAILABLE,
              },
            });
          }
        }

        return tx.order.update({
          where: { id: orderId },
          data: { status: OrderStatus.CANCELLED },
        });
      });
    }

    return prisma.order.update({
      where: { id: orderId },
      data: { status: data.status },
      include: {
        buyer: {
          select: { id: true, name: true, phone: true, email: true },
        },
      },
    });
  }

  async cancelOrderByBuyer(orderId: string, buyerId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      throw new AppError('Pedido no encontrado.', 404);
    }

    if (order.buyerId !== buyerId) {
      throw new AppError('No tienes permiso para cancelar este pedido.', 403);
    }

    if (order.status !== OrderStatus.PENDING) {
      throw new AppError('Solo puedes cancelar pedidos que se encuentren en estado PENDIENTE.', 400);
    }

    return prisma.$transaction(async (tx) => {
      for (const item of order.items) {
        const productExists = await tx.product.findUnique({ where: { id: item.productId } });
        if (productExists) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: { increment: item.quantity },
              status: ProductStatus.AVAILABLE,
            },
          });
        }
      }

      return tx.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.CANCELLED },
      });
    });
  }

  async createReview(buyerId: string, data: CreateReviewInput) {
    return prisma.review.create({
      data: {
        rating: data.rating,
        comment: data.comment?.trim() || null,
        buyerId,
        sellerId: data.sellerId,
        productId: data.productId || null,
      },
    });
  }
}
