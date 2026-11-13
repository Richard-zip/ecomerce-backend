import { Request, Response, NextFunction } from 'express';
import { OrdersService } from './orders.service';
import { createOrderSchema, updateOrderStatusSchema, createReviewSchema } from './orders.schema';

const ordersService = new OrdersService();

export class OrdersController {
  async createOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const buyerId = req.user!.id;
      const validatedData = createOrderSchema.parse(req.body);
      const order = await ordersService.createOrder(buyerId, validatedData);

      res.status(201).json({
        success: true,
        message: 'Pedido realizado con éxito. El vendedor ha sido notificado para coordinar la entrega.',
        data: order,
      });
    } catch (error) {
      next(error);
    }
  }

  async getBuyerOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const buyerId = req.user!.id;
      const orders = await ordersService.getBuyerOrders(buyerId);

      res.status(200).json({
        success: true,
        data: orders,
      });
    } catch (error) {
      next(error);
    }
  }

  async getSellerOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const sellerId = req.user!.id;
      const orders = await ordersService.getSellerOrders(sellerId);

      res.status(200).json({
        success: true,
        data: orders,
      });
    } catch (error) {
      next(error);
    }
  }

  async getOrderById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const userId = req.user!.id;
      const order = await ordersService.getOrderById(id, userId);

      res.status(200).json({
        success: true,
        data: order,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateOrderStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const sellerId = req.user!.id;
      const validatedData = updateOrderStatusSchema.parse(req.body);

      const order = await ordersService.updateOrderStatus(id, sellerId, validatedData);

      res.status(200).json({
        success: true,
        message: `Estado del pedido actualizado a ${validatedData.status}.`,
        data: order,
      });
    } catch (error) {
      next(error);
    }
  }

  async cancelOrderByBuyer(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const buyerId = req.user!.id;

      const order = await ordersService.cancelOrderByBuyer(id, buyerId);

      res.status(200).json({
        success: true,
        message: 'Pedido cancelado correctamente y el stock ha sido restablecido.',
        data: order,
      });
    } catch (error) {
      next(error);
    }
  }

  async createReview(req: Request, res: Response, next: NextFunction) {
    try {
      const buyerId = req.user!.id;
      const validatedData = createReviewSchema.parse(req.body);
      const review = await ordersService.createReview(buyerId, validatedData);

      res.status(201).json({
        success: true,
        message: 'Calificación registrada exitosamente.',
        data: review,
      });
    } catch (error) {
      next(error);
    }
  }
}
