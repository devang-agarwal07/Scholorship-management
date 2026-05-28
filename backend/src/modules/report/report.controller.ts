import { Request, Response, NextFunction } from 'express';
import { reportService } from './report.service';

export class ReportController {
  async getSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const summary = await reportService.getSummary();
      res.json(summary);
    } catch (error) {
      next(error);
    }
  }

  async getApplicationsReport(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = {
        scholarshipId: req.query.scholarshipId as string | undefined,
        status: req.query.status as string | undefined,
        academicYear: req.query.academicYear as string | undefined,
        format: (req.query.format as 'json' | 'csv' | 'pdf') || 'json',
      };

      const result = await reportService.getApplicationsReport(filters);

      if (filters.format === 'csv') {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=applications_report.csv');
        res.send(result);
        return;
      }

      if (filters.format === 'pdf') {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=applications_report.pdf');
        res.send(result);
        return;
      }

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getDisbursementReport(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = {
        academicYear: req.query.academicYear as string | undefined,
        format: (req.query.format as 'json' | 'csv' | 'pdf') || 'json',
      };

      const result = await reportService.getDisbursementReport(filters);

      if (filters.format === 'csv') {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=disbursement_report.csv');
        res.send(result);
        return;
      }

      if (filters.format === 'pdf') {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=disbursement_report.pdf');
        res.send(result);
        return;
      }

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getPendingActions(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await reportService.getPendingActionsReport();
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}

export const reportController = new ReportController();
