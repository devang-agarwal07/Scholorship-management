import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { workflowService } from './workflow.service';
import { WorkflowStage } from '../../constants/enums';

const actionSchema = z.object({
  action: z.enum(['APPROVE', 'REJECT', 'REQUEST_CHANGES', 'VERIFY', 'DISBURSE', 'WAITLIST']),
  stage: z.enum(['DOCUMENT_VERIFICATION', 'COMMITTEE_REVIEW', 'FINAL_APPROVAL', 'DISBURSEMENT']),
  remarks: z.string().optional(),
});

const bulkActionSchema = z.object({
  applicationIds: z.array(z.string()).min(1, 'At least one application ID is required'),
  action: z.enum(['APPROVE', 'REJECT', 'REQUEST_CHANGES', 'VERIFY', 'DISBURSE', 'WAITLIST']),
  stage: z.enum(['DOCUMENT_VERIFICATION', 'COMMITTEE_REVIEW', 'FINAL_APPROVAL', 'DISBURSEMENT']),
  remarks: z.string().optional(),
});

export class WorkflowController {
  async takeAction(req: Request, res: Response, next: NextFunction) {
    try {
      const { applicationId } = req.params;
      const data = actionSchema.parse(req.body);

      const result = await workflowService.takeAction(
        applicationId,
        req.user!.userId,
        data.action as 'APPROVE' | 'REJECT' | 'REQUEST_CHANGES' | 'VERIFY' | 'DISBURSE' | 'WAITLIST',
        data.stage as WorkflowStage,
        data.remarks
      );

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async bulkAction(req: Request, res: Response, next: NextFunction) {
    try {
      const data = bulkActionSchema.parse(req.body);

      const result = await workflowService.bulkAction(
        data.applicationIds,
        req.user!.userId,
        data.action as 'APPROVE' | 'REJECT' | 'REQUEST_CHANGES' | 'VERIFY' | 'DISBURSE' | 'WAITLIST',
        data.stage as WorkflowStage,
        data.remarks
      );

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await workflowService.getHistory(req.params.applicationId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getAvailableActions(req: Request, res: Response, next: NextFunction) {
    try {
      const { status } = req.params;
      const actions = workflowService.getAvailableActions(status);
      res.json({ status, availableActions: actions });
    } catch (error) {
      next(error);
    }
  }
}

export const workflowController = new WorkflowController();
