import { Request, Response, NextFunction } from 'express';
import { ProductsService } from './products.service';
import { createProductSchema, updateProductSchema, productQuerySchema } from './products.schema';

const productsService = new ProductsService();

export class ProductsController {
  async createProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const sellerId = req.user!.id;
      const validatedData = createProductSchema.parse(req.body);
      const product = await productsService.createProduct(sellerId, validatedData);

      res.status(201).json({
        success: true,
        message: 'Producto publicado con éxito.',
        data: product,
      });
    } catch (error) {
      next(error);
    }
  }

  async getProducts(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = productQuerySchema.parse(req.query);
      const result = await productsService.getProducts(filters);

      res.status(200).json({
        success: true,
        data: result.products,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  async getProductById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const product = await productsService.getProductById(id);

      res.status(200).json({
        success: true,
        data: product,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const sellerId = req.user!.id;
      const validatedData = updateProductSchema.parse(req.body);

      const updated = await productsService.updateProduct(id, sellerId, validatedData);

      res.status(200).json({
        success: true,
        message: 'Producto actualizado con éxito.',
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const sellerId = req.user!.id;

      const result = await productsService.deleteProduct(id, sellerId);

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }

  async getMyProducts(req: Request, res: Response, next: NextFunction) {
    try {
      const sellerId = req.user!.id;
      const products = await productsService.getMyProducts(sellerId);

      res.status(200).json({
        success: true,
        data: products,
      });
    } catch (error) {
      next(error);
    }
  }

  async getWhatsAppCheckout(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const { quantity, meetingPoint, clientName, notes } = {
        ...req.query,
        ...req.body,
      };

      const finalClientName = clientName || req.user?.name || undefined;

      const result = await productsService.generateWhatsAppCheckout(id, {
        quantity: quantity ? Number(quantity) : 1,
        meetingPoint: meetingPoint ? String(meetingPoint) : undefined,
        clientName: finalClientName ? String(finalClientName) : undefined,
        notes: notes ? String(notes) : undefined,
      });

      res.status(200).json({
        success: true,
        message: 'Enlace de WhatsApp generado con éxito para compra directa.',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}
