import { Request, Response, NextFunction } from 'express';
import { CategoriesService } from './categories.service';
import { z } from 'zod';

const categoriesService = new CategoriesService();

const createCategorySchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  description: z.string().optional(),
});

export class CategoriesController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const categories = await categoriesService.getAll();
      res.status(200).json({
        success: true,
        data: categories,
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const category = await categoriesService.getById(id);
      res.status(200).json({
        success: true,
        data: category,
      });
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, description } = createCategorySchema.parse(req.body);
      const category = await categoriesService.create(name, description);
      res.status(201).json({
        success: true,
        message: 'Categoría creada con éxito.',
        data: category,
      });
    } catch (error) {
      next(error);
    }
  }
}
