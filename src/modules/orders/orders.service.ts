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

  async getSellerAnalytics(sellerId: string) {
    const [orders, products, reviews] = await Promise.all([
      prisma.order.findMany({
        where: { sellerId },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  title: true,
                  images: true,
                  price: true,
                  stock: true,
                  status: true,
                  category: { select: { name: true } },
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.findMany({
        where: { sellerId },
        select: {
          id: true,
          title: true,
          price: true,
          stock: true,
          status: true,
          images: true,
        },
      }),
      prisma.review.findMany({
        where: { sellerId },
        select: { rating: true, comment: true, createdAt: true },
      }),
    ]);

    // Métricas de pedidos
    const totalOrders = orders.length;
    const ordersByStatus = {
      PENDING: 0,
      CONFIRMED: 0,
      DELIVERED: 0,
      CANCELLED: 0,
    };

    let totalDeliveredRevenue = 0;
    let potentialRevenue = 0;

    for (const order of orders) {
      if (ordersByStatus[order.status] !== undefined) {
        ordersByStatus[order.status]++;
      }
      if (order.status === OrderStatus.DELIVERED) {
        totalDeliveredRevenue += order.totalAmount;
      } else if (order.status === OrderStatus.PENDING || order.status === OrderStatus.CONFIRMED) {
        potentialRevenue += order.totalAmount;
      }
    }

    const deliveredCount = ordersByStatus.DELIVERED;
    const deliveredRate = totalOrders > 0 ? Math.round((deliveredCount / totalOrders) * 100) : 0;
    const averageOrderValue = deliveredCount > 0 ? Math.round(totalDeliveredRevenue / deliveredCount) : 0;

    // Ventas agrupadas por los últimos 6 meses
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const monthlyMap = new Map<string, { label: string; revenue: number; ordersCount: number }>();

    // Inicializar últimos 6 meses
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
      monthlyMap.set(key, { label, revenue: 0, ordersCount: 0 });
    }

    // Agregar pedidos entregados a los meses
    for (const order of orders) {
      if (order.status === OrderStatus.DELIVERED) {
        const d = new Date(order.createdAt);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (monthlyMap.has(key)) {
          const entry = monthlyMap.get(key)!;
          entry.revenue += order.totalAmount;
          entry.ordersCount++;
        }
      }
    }

    const salesByMonth = Array.from(monthlyMap.values());

    // Top productos más vendidos (por volumen e ingresos)
    const productStatsMap = new Map<
      string,
      {
        id: string;
        title: string;
        images: string[];
        unitsSold: number;
        revenue: number;
        currentStock: number;
        status: ProductStatus;
      }
    >();

    for (const order of orders) {
      if (order.status === OrderStatus.DELIVERED || order.status === OrderStatus.CONFIRMED) {
        for (const item of order.items) {
          const prod = item.product;
          if (!prod) continue;

          if (!productStatsMap.has(prod.id)) {
            productStatsMap.set(prod.id, {
              id: prod.id,
              title: prod.title,
              images: prod.images || [],
              unitsSold: 0,
              revenue: 0,
              currentStock: prod.stock,
              status: prod.status,
            });
          }

          const stat = productStatsMap.get(prod.id)!;
          stat.unitsSold += item.quantity;
          stat.revenue += item.unitPrice * item.quantity;
        }
      }
    }

    const topProducts = Array.from(productStatsMap.values())
      .sort((a, b) => b.unitsSold - a.unitsSold || b.revenue - a.revenue)
      .slice(0, 5);

    // Salud del inventario
    const inventoryHealth = {
      totalProducts: products.length,
      available: products.filter((p) => p.status === ProductStatus.AVAILABLE).length,
      soldOut: products.filter((p) => p.status === ProductStatus.SOLD_OUT).length,
      paused: products.filter((p) => p.status === ProductStatus.PAUSED).length,
      totalStockUnits: products.reduce((acc, p) => acc + p.stock, 0),
    };

    // Reseñas y satisfacción
    const totalReviews = reviews.length;
    const averageRating =
      totalReviews > 0
        ? Math.round((reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews) * 10) / 10
        : 5.0;

    const ratingBreakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    for (const r of reviews) {
      if (ratingBreakdown[r.rating as keyof typeof ratingBreakdown] !== undefined) {
        ratingBreakdown[r.rating as keyof typeof ratingBreakdown]++;
      }
    }

    return {
      totalDeliveredRevenue,
      potentialRevenue,
      totalOrders,
      ordersByStatus,
      deliveredRate,
      averageOrderValue,
      salesByMonth,
      topProducts,
      inventoryHealth,
      reviewsStats: {
        totalReviews,
        averageRating,
        ratingBreakdown,
      },
    };
  }
}
