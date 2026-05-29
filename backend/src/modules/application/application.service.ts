import prisma from '../../config/database';
import { AppError } from '../../middleware/errorHandler';
import { ApplicationStatus, Role } from '../../constants/enums';
import { Prisma } from '@prisma/client';
import { notificationService } from '../notification/notification.service';
import { addEmailJob } from '../../jobs/queue';

interface CreateApplicationData {
  scholarshipId: string;
  personalStatement?: string;
  familyIncome?: number;
  academicDetails?: Record<string, unknown>;
}

class ApplicationService {
  async create(studentId: string, data: CreateApplicationData) {
    // Check if scholarship exists and is active
    const scholarship = await prisma.scholarship.findUnique({
      where: { id: data.scholarshipId },
    });

    if (!scholarship) {
      throw new AppError('Scholarship not found.', 404);
    }

    if (!scholarship.isActive) {
      throw new AppError('This scholarship is no longer accepting applications.', 400);
    }

    if (new Date() > scholarship.applicationDeadline) {
      throw new AppError('The application deadline has passed.', 400);
    }

    // Check for existing application
    const existing = await prisma.application.findUnique({
      where: {
        studentId_scholarshipId: {
          studentId,
          scholarshipId: data.scholarshipId,
        },
      },
    });

    if (existing) {
      throw new AppError('You have already applied for this scholarship.', 409);
    }

    const application = await prisma.application.create({
      data: {
        studentId,
        scholarshipId: data.scholarshipId,
        personalStatement: data.personalStatement,
        familyIncome: data.familyIncome,
        academicDetails: data.academicDetails as Prisma.JsonObject || undefined,
        status: 'DRAFT',
      },
      include: {
        scholarship: true,
        student: { include: { profile: true } },
      },
    });

    return application;
  }

  async findAll(filters: {
    userId: string;
    userRole: string;
    status?: string;
    scholarshipId?: string;
    page?: number;
    limit?: number;
  }) {
    const { userId, userRole, status, scholarshipId, page = 1, limit = 10 } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.ApplicationWhereInput = {};

    // Students can only see their own
    if (userRole === 'STUDENT') {
      where.studentId = userId;
    }

    // Verifiers see submitted + under verification
    if (userRole === 'VERIFIER') {
      where.status = { in: ['SUBMITTED', 'UNDER_VERIFICATION'] };
    }

    // Committee sees verification complete + under review
    if (userRole === 'COMMITTEE') {
      where.status = { in: ['VERIFICATION_COMPLETE', 'UNDER_REVIEW'] };
    }

    if (status) {
      where.status = status as ApplicationStatus;
    }

    if (scholarshipId) {
      where.scholarshipId = scholarshipId;
    }

    const [applications, total] = await Promise.all([
      prisma.application.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
        include: {
          scholarship: { select: { id: true, name: true, perAwardAmount: true, applicationDeadline: true } },
          student: {
            include: {
              profile: { select: { firstName: true, lastName: true, institution: true, department: true } },
            },
          },
          _count: { select: { documents: true } },
        },
      }),
      prisma.application.count({ where }),
    ]);

    return {
      applications,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(applicationId: string, userId: string, userRole: string) {
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        scholarship: true,
        student: { include: { profile: true } },
        documents: {
          include: {
            reviews: {
              include: {
                reviewer: { select: { id: true, email: true, profile: { select: { firstName: true, lastName: true } } } },
              },
            },
          },
        },
        workflowStages: {
          orderBy: { createdAt: 'desc' },
          include: {
            actor: { select: { id: true, email: true, profile: { select: { firstName: true, lastName: true } } } },
          },
        },
      },
    });

    if (!application) {
      throw new AppError('Application not found.', 404);
    }

    // Students can only see their own application
    if (userRole === 'STUDENT' && application.studentId !== userId) {
      throw new AppError('You do not have access to this application.', 403);
    }

    return application;
  }

  async update(applicationId: string, studentId: string, data: Partial<CreateApplicationData>) {
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
    });

    if (!application) {
      throw new AppError('Application not found.', 404);
    }

    if (application.studentId !== studentId) {
      throw new AppError('You can only update your own applications.', 403);
    }

    if (application.status !== 'DRAFT') {
      throw new AppError('Only draft applications can be updated.', 400);
    }

    const updateData: Record<string, unknown> = {};
    if (data.personalStatement !== undefined) updateData.personalStatement = data.personalStatement;
    if (data.familyIncome !== undefined) updateData.familyIncome = data.familyIncome;
    if (data.academicDetails !== undefined) updateData.academicDetails = data.academicDetails as Prisma.JsonObject;

    const updated = await prisma.application.update({
      where: { id: applicationId },
      data: updateData,
      include: {
        scholarship: true,
        documents: true,
      },
    });

    return updated;
  }

  async submit(applicationId: string, studentId: string) {
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        scholarship: true,
        documents: true,
        student: { include: { profile: true } },
      },
    });

    if (!application) {
      throw new AppError('Application not found.', 404);
    }

    if (application.studentId !== studentId) {
      throw new AppError('You can only submit your own applications.', 403);
    }

    if (application.status !== 'DRAFT') {
      throw new AppError('Only draft applications can be submitted.', 400);
    }

    // Validate required documents
    const requiredDocs = application.scholarship.requiredDocuments;
    const uploadedDocTypes = application.documents.map((d) => d.documentType);
    const missingDocs = requiredDocs.filter((doc) => !uploadedDocTypes.includes(doc));

    if (missingDocs.length > 0) {
      throw new AppError(
        `Missing required documents: ${missingDocs.join(', ')}`,
        400
      );
    }

    const updated = await prisma.application.update({
      where: { id: applicationId },
      data: {
        status: 'SUBMITTED',
        submittedAt: new Date(),
      },
      include: { scholarship: true },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: studentId,
        action: 'SUBMIT_APPLICATION',
        entity: 'Application',
        entityId: applicationId,
      },
    });

    // Send notification
    await notificationService.notifyStatusChange(applicationId, 'SUBMITTED');

    // Queue email
    const profile = application.student.profile;
    await addEmailJob({
      to: application.student.email,
      subject: `Application Submitted: ${application.scholarship.name}`,
      template: 'application_submitted',
      context: {
        studentName: profile ? `${profile.firstName} ${profile.lastName}` : application.student.email,
        scholarshipName: application.scholarship.name,
        applicationId: application.id,
      },
    });

    return updated;
  }

  async getMyApplications(studentId: string) {
    const applications = await prisma.application.findMany({
      where: { studentId },
      orderBy: { updatedAt: 'desc' },
      include: {
        scholarship: {
          select: { id: true, name: true, perAwardAmount: true, applicationDeadline: true, academicYear: true },
        },
        _count: { select: { documents: true, workflowStages: true } },
      },
    });

    return applications;
  }
}

export const applicationService = new ApplicationService();
