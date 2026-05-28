import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { scholarshipService } from './scholarship.service';

const createScholarshipSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  totalBudget: z.number().positive('Budget must be positive'),
  perAwardAmount: z.number().positive('Award amount must be positive'),
  maxAwardees: z.number().int().positive('Max awardees must be a positive integer'),
  eligibilityCriteria: z.object({
    minCgpa: z.number().min(0).max(10).optional(),
    maxFamilyIncome: z.number().positive().optional(),
    allowedDepartments: z.array(z.string()).optional(),
    allowedYears: z.array(z.number().int()).optional(),
    minYearOfStudy: z.number().int().optional(),
    maxYearOfStudy: z.number().int().optional(),
  }),
  requiredDocuments: z.array(z.string()).min(1, 'At least one required document type'),
  applicationDeadline: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid date'),
  academicYear: z.string().min(1, 'Academic year is required'),
});

const updateScholarshipSchema = createScholarshipSchema.partial();

export class ScholarshipController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createScholarshipSchema.parse(req.body);
      const scholarship = await scholarshipService.create(data);

      await import('../../config/database').then(({ default: prisma }) =>
        prisma.auditLog.create({
          data: {
            userId: req.user!.userId,
            action: 'CREATE_SCHOLARSHIP',
            entity: 'Scholarship',
            entityId: scholarship.id,
            metadata: { name: scholarship.name },
          },
        })
      );

      res.status(201).json(scholarship);
    } catch (error) {
      next(error);
    }
  }

  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const search = req.query.search as string | undefined;
      const isActive = req.query.isActive !== 'false';
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);

      const result = await scholarshipService.findAll({ search, isActive, page, limit });
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const scholarship = await scholarshipService.findById(req.params.id);
      res.json(scholarship);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const data = updateScholarshipSchema.parse(req.body);
      const scholarship = await scholarshipService.update(req.params.id, data);

      await import('../../config/database').then(({ default: prisma }) =>
        prisma.auditLog.create({
          data: {
            userId: req.user!.userId,
            action: 'UPDATE_SCHOLARSHIP',
            entity: 'Scholarship',
            entityId: scholarship.id,
          },
        })
      );

      res.json(scholarship);
    } catch (error) {
      next(error);
    }
  }

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await scholarshipService.softDelete(req.params.id);

      await import('../../config/database').then(({ default: prisma }) =>
        prisma.auditLog.create({
          data: {
            userId: req.user!.userId,
            action: 'DELETE_SCHOLARSHIP',
            entity: 'Scholarship',
            entityId: req.params.id,
          },
        })
      );

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async checkEligibility(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await scholarshipService.checkEligibility(
        req.user!.userId,
        req.params.id
      );
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}

export const scholarshipController = new ScholarshipController();
