import prisma from '../../config/database';
import { AppError } from '../../middleware/errorHandler';
import { ApplicationStatus, WorkflowStage } from '@prisma/client';
import { notificationService } from '../notification/notification.service';

const VALID_TRANSITIONS: Record<string, ApplicationStatus[]> = {
  SUBMITTED: ['UNDER_VERIFICATION'],
  UNDER_VERIFICATION: ['VERIFICATION_COMPLETE', 'REJECTED'],
  VERIFICATION_COMPLETE: ['UNDER_REVIEW'],
  UNDER_REVIEW: ['APPROVED', 'REJECTED', 'WAITLISTED'],
  APPROVED: ['DISBURSED'],
  WAITLISTED: ['APPROVED', 'REJECTED'],
};

type WorkflowAction = 'APPROVE' | 'REJECT' | 'REQUEST_CHANGES' | 'VERIFY' | 'DISBURSE' | 'WAITLIST';

const ACTION_TO_STATUS: Record<string, Record<string, ApplicationStatus>> = {
  SUBMITTED: {
    VERIFY: 'UNDER_VERIFICATION',
  },
  UNDER_VERIFICATION: {
    APPROVE: 'VERIFICATION_COMPLETE',
    REJECT: 'REJECTED',
  },
  VERIFICATION_COMPLETE: {
    APPROVE: 'UNDER_REVIEW',
  },
  UNDER_REVIEW: {
    APPROVE: 'APPROVED',
    REJECT: 'REJECTED',
    WAITLIST: 'WAITLISTED',
  },
  APPROVED: {
    DISBURSE: 'DISBURSED',
  },
  WAITLISTED: {
    APPROVE: 'APPROVED',
    REJECT: 'REJECTED',
  },
};

class WorkflowService {
  resolveNewStatus(currentStatus: string, action: string): ApplicationStatus | null {
    const transitions = ACTION_TO_STATUS[currentStatus];
    if (!transitions) return null;
    return transitions[action] || null;
  }

  async takeAction(
    applicationId: string,
    actorId: string,
    action: WorkflowAction,
    stage: WorkflowStage,
    remarks?: string
  ) {
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: { scholarship: true },
    });

    if (!application) {
      throw new AppError('Application not found.', 404);
    }

    const newStatus = this.resolveNewStatus(application.status, action);

    if (!newStatus) {
      throw new AppError(
        `Invalid action "${action}" for current status "${application.status}".`,
        400
      );
    }

    const validTargets = VALID_TRANSITIONS[application.status];
    if (!validTargets || !validTargets.includes(newStatus)) {
      throw new AppError(
        `Cannot transition from "${application.status}" to "${newStatus}".`,
        400
      );
    }

    // Rejection requires remarks
    if (action === 'REJECT' && !remarks) {
      throw new AppError('Remarks are required when rejecting an application.', 400);
    }

    // Execute transition atomically
    const [updatedApplication] = await prisma.$transaction([
      prisma.application.update({
        where: { id: applicationId },
        data: { status: newStatus },
        include: { scholarship: true, student: { include: { profile: true } } },
      }),
      prisma.workflowAction.create({
        data: {
          applicationId,
          actorId,
          stage,
          action,
          remarks,
        },
      }),
      prisma.auditLog.create({
        data: {
          userId: actorId,
          action: `WORKFLOW_${action}`,
          entity: 'Application',
          entityId: applicationId,
          metadata: { previousStatus: application.status, newStatus, remarks },
        },
      }),
    ]);

    // Send notifications
    await notificationService.notifyStatusChange(applicationId, newStatus);

    return {
      application: updatedApplication,
      previousStatus: application.status,
      newStatus,
    };
  }

  async bulkAction(
    applicationIds: string[],
    actorId: string,
    action: WorkflowAction,
    stage: WorkflowStage,
    remarks?: string
  ) {
    const results = [];
    const errors = [];

    for (const applicationId of applicationIds) {
      try {
        const result = await this.takeAction(applicationId, actorId, action, stage, remarks);
        results.push({ applicationId, success: true, ...result });
      } catch (error) {
        errors.push({
          applicationId,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return { results, errors, totalProcessed: results.length, totalErrors: errors.length };
  }

  async getHistory(applicationId: string) {
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
    });

    if (!application) {
      throw new AppError('Application not found.', 404);
    }

    const history = await prisma.workflowAction.findMany({
      where: { applicationId },
      orderBy: { createdAt: 'asc' },
      include: {
        actor: {
          select: {
            id: true,
            email: true,
            role: true,
            profile: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });

    return {
      applicationId,
      currentStatus: application.status,
      history,
    };
  }

  getAvailableActions(currentStatus: string): { action: string; targetStatus: string }[] {
    const transitions = ACTION_TO_STATUS[currentStatus];
    if (!transitions) return [];

    return Object.entries(transitions).map(([action, targetStatus]) => ({
      action,
      targetStatus,
    }));
  }
}

export const workflowService = new WorkflowService();
