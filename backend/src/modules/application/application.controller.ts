import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { applicationService } from './application.service';

const createApplicationSchema = z.object({
  scholarshipId: z.string().min(1, 'Scholarship ID is required'),
  personalStatement: z.string().max(5000).optional(),
  familyIncome: z.number().positive().optional(),
  academicDetails: z.record(z.unknown()).optional(),
});

const updateApplicationSchema = z.object({
  personalStatement: z.string().max(5000).optional(),
  familyIncome: z.number().positive().optional(),
  academicDetails: z.record(z.unknown()).optional(),
});

export class ApplicationController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createApplicationSchema.parse(req.body);
      const application = await applicationService.create(req.user!.userId, data);
      res.status(201).json(application);
    } catch (error) {
      next(error);
    }
  }

  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);
      const status = req.query.status as string | undefined;
      const scholarshipId = req.query.scholarshipId as string | undefined;

      const result = await applicationService.findAll({
        userId: req.user!.userId,
        userRole: req.user!.role,
        status,
        scholarshipId,
        page,
        limit,
      });
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const application = await applicationService.findById(
        req.params.id,
        req.user!.userId,
        req.user!.role
      );
      res.json(application);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const data = updateApplicationSchema.parse(req.body);
      const application = await applicationService.update(
        req.params.id,
        req.user!.userId,
        data
      );
      res.json(application);
    } catch (error) {
      next(error);
    }
  }

  async submit(req: Request, res: Response, next: NextFunction) {
    try {
      const application = await applicationService.submit(
        req.params.id,
        req.user!.userId
      );
      res.json({ message: 'Application submitted successfully', application });
    } catch (error) {
      next(error);
    }
  }

  async getMyApplications(req: Request, res: Response, next: NextFunction) {
    try {
      const applications = await applicationService.getMyApplications(req.user!.userId);
      res.json(applications);
    } catch (error) {
      next(error);
    }
  }
}

export const applicationController = new ApplicationController();
