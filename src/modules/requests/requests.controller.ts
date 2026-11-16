import { Request, Response, NextFunction } from 'express';
import { RequestsService } from './requests.service';
import { createRequestSchema, updateRequestStatusSchema, createOfferSchema } from './requests.schema';
import { RequestStatus } from '@prisma/client';

const requestsService = new RequestsService();

export class RequestsController {
  async getRequests(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, career, search, page, limit } = req.query;
      const result = await requestsService.getRequests({
        status: status as RequestStatus | undefined,
        career: career as string | undefined,
        search: search as string | undefined,
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
      });

      res.status(200).json({
        success: true,
        data: result.requests,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  async getRequestById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const request = await requestsService.getRequestById(id);

      res.status(200).json({
        success: true,
        data: request,
      });
    } catch (error) {
      next(error);
    }
  }

  async getMyRequests(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const requests = await requestsService.getMyRequests(userId);

      res.status(200).json({
        success: true,
        data: requests,
      });
    } catch (error) {
      next(error);
    }
  }

  async createRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const validatedData = createRequestSchema.parse(req.body);
      const request = await requestsService.createRequest(userId, validatedData);

      res.status(201).json({
        success: true,
        message: 'Petición publicada con éxito en el tablero universitario.',
        data: request,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateRequestStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const userId = req.user!.id;
      const { status } = updateRequestStatusSchema.parse(req.body);
      const updated = await requestsService.updateRequestStatus(id, userId, status);

      res.status(200).json({
        success: true,
        message: 'Estado de la petición actualizado.',
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const userId = req.user!.id;
      const result = await requestsService.deleteRequest(id, userId);

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }

  async createOffer(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const sellerId = req.user!.id;
      const validatedData = createOfferSchema.parse(req.body);
      const offer = await requestsService.createOffer(id, sellerId, validatedData);

      res.status(201).json({
        success: true,
        message: 'Oferta enviada exitosamente al solicitante.',
        data: offer,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteOffer(req: Request, res: Response, next: NextFunction) {
    try {
      const offerId = req.params.offerId as string;
      const sellerId = req.user!.id;
      const result = await requestsService.deleteOffer(offerId, sellerId);

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }
}
