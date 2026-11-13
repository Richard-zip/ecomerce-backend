import { Request, Response, NextFunction } from 'express';
import { UsersService } from './users.service';
import { z } from 'zod';

const usersService = new UsersService();

const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  career: z.string().optional(),
  campus: z.string().optional(),
  avatar: z.string().optional(),
});

export class UsersController {
  async getSellerProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const profile = await usersService.getSellerPublicProfile(id);

      res.status(200).json({
        success: true,
        data: profile,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const validatedData = updateProfileSchema.parse(req.body);
      const updated = await usersService.updateProfile(userId, validatedData);

      res.status(200).json({
        success: true,
        message: 'Perfil actualizado con éxito.',
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }
}
