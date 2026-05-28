import prisma from '../../config/database';
import { AppError } from '../../middleware/errorHandler';
import { Prisma } from '@prisma/client';

interface EligibilityCriteria {
  minCgpa?: number;
  maxFamilyIncome?: number;
  allowedDepartments?: string[];
  allowedYears?: number[];
  minYearOfStudy?: number;
  maxYearOfStudy?: number;
}

interface CreateScholarshipData {
  name: string;
  description: string;
  totalBudget: number;
  perAwardAmount: number;
  maxAwardees: number;
  eligibilityCriteria: EligibilityCriteria;
  requiredDocuments: string[];
  applicationDeadline: string;
  academicYear: string;
}

class ScholarshipService {
  async create(data: CreateScholarshipData) {
    const scholarship = await prisma.scholarship.create({
      data: {
        name: data.name,
        description: data.description,
        totalBudget: data.totalBudget,
        perAwardAmount: data.perAwardAmount,
        maxAwardees: data.maxAwardees,
        eligibilityCriteria: data.eligibilityCriteria as unknown as Prisma.JsonObject,
        requiredDocuments: data.requiredDocuments,
        applicationDeadline: new Date(data.applicationDeadline),
        academicYear: data.academicYear,
      },
    });
    return scholarship;
  }

  async findAll(filters: { search?: string; isActive?: boolean; page?: number; limit?: number }) {
    const { search, isActive = true, page = 1, limit = 10 } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.ScholarshipWhereInput = { isActive };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [scholarships, total] = await Promise.all([
      prisma.scholarship.findMany({
        where,
        orderBy: { applicationDeadline: 'asc' },
        skip,
        take: limit,
        include: {
          _count: { select: { applications: true } },
        },
      }),
      prisma.scholarship.count({ where }),
    ]);

    return {
      scholarships,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string) {
    const scholarship = await prisma.scholarship.findUnique({
      where: { id },
      include: {
        _count: { select: { applications: true } },
        applications: {
          select: { status: true },
        },
      },
    });

    if (!scholarship) {
      throw new AppError('Scholarship not found.', 404);
    }

    // Calculate budget utilization
    const approvedCount = scholarship.applications.filter(
      (a) => a.status === 'APPROVED' || a.status === 'DISBURSED'
    ).length;
    const allocatedBudget = approvedCount * scholarship.perAwardAmount;
    const remainingBudget = scholarship.totalBudget - allocatedBudget;

    return {
      ...scholarship,
      approvedCount,
      allocatedBudget,
      remainingBudget,
      utilizationPercentage: scholarship.totalBudget > 0
        ? Math.round((allocatedBudget / scholarship.totalBudget) * 100)
        : 0,
    };
  }

  async update(id: string, data: Partial<CreateScholarshipData>) {
    const existing = await prisma.scholarship.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Scholarship not found.', 404);
    }

    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.totalBudget !== undefined) updateData.totalBudget = data.totalBudget;
    if (data.perAwardAmount !== undefined) updateData.perAwardAmount = data.perAwardAmount;
    if (data.maxAwardees !== undefined) updateData.maxAwardees = data.maxAwardees;
    if (data.eligibilityCriteria !== undefined)
      updateData.eligibilityCriteria = data.eligibilityCriteria as unknown as Prisma.JsonObject;
    if (data.requiredDocuments !== undefined) updateData.requiredDocuments = data.requiredDocuments;
    if (data.applicationDeadline !== undefined)
      updateData.applicationDeadline = new Date(data.applicationDeadline);
    if (data.academicYear !== undefined) updateData.academicYear = data.academicYear;

    const scholarship = await prisma.scholarship.update({
      where: { id },
      data: updateData,
    });
    return scholarship;
  }

  async softDelete(id: string) {
    const existing = await prisma.scholarship.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Scholarship not found.', 404);
    }

    await prisma.scholarship.update({
      where: { id },
      data: { isActive: false },
    });
    return { message: 'Scholarship deactivated successfully.' };
  }

  async checkEligibility(
    studentId: string,
    scholarshipId: string
  ): Promise<{ eligible: boolean; reasons: string[] }> {
    const [profile, scholarship] = await Promise.all([
      prisma.profile.findUnique({ where: { userId: studentId } }),
      prisma.scholarship.findUnique({ where: { id: scholarshipId } }),
    ]);

    if (!profile) {
      return { eligible: false, reasons: ['Student profile not found. Please complete your profile.'] };
    }

    if (!scholarship) {
      return { eligible: false, reasons: ['Scholarship not found.'] };
    }

    if (!scholarship.isActive) {
      return { eligible: false, reasons: ['This scholarship is no longer active.'] };
    }

    if (new Date() > scholarship.applicationDeadline) {
      return { eligible: false, reasons: ['The application deadline has passed.'] };
    }

    const criteria = scholarship.eligibilityCriteria as unknown as EligibilityCriteria;
    const reasons: string[] = [];

    if (criteria.minCgpa && (!profile.cgpa || profile.cgpa < criteria.minCgpa)) {
      reasons.push(`Minimum CGPA required: ${criteria.minCgpa}. Your CGPA: ${profile.cgpa || 'Not set'}`);
    }

    if (criteria.maxFamilyIncome) {
      // Family income is on the application, not profile - skip this check at eligibility time
    }

    if (criteria.allowedDepartments?.length && profile.department) {
      if (!criteria.allowedDepartments.includes(profile.department)) {
        reasons.push(`Not available for ${profile.department} department.`);
      }
    }

    if (criteria.allowedYears?.length && profile.yearOfStudy) {
      if (!criteria.allowedYears.includes(profile.yearOfStudy)) {
        reasons.push(`Not available for year ${profile.yearOfStudy} students.`);
      }
    }

    if (criteria.minYearOfStudy && profile.yearOfStudy && profile.yearOfStudy < criteria.minYearOfStudy) {
      reasons.push(`Minimum year of study required: ${criteria.minYearOfStudy}`);
    }

    if (criteria.maxYearOfStudy && profile.yearOfStudy && profile.yearOfStudy > criteria.maxYearOfStudy) {
      reasons.push(`Maximum year of study allowed: ${criteria.maxYearOfStudy}`);
    }

    // Check max awardees
    const approvedCount = await prisma.application.count({
      where: {
        scholarshipId,
        status: { in: ['APPROVED', 'DISBURSED'] },
      },
    });

    if (approvedCount >= scholarship.maxAwardees) {
      reasons.push('All available slots have been filled.');
    }

    // Check if already applied
    const existingApp = await prisma.application.findUnique({
      where: {
        studentId_scholarshipId: {
          studentId,
          scholarshipId,
        },
      },
    });

    if (existingApp) {
      reasons.push('You have already applied for this scholarship.');
    }

    return { eligible: reasons.length === 0, reasons };
  }
}

export const scholarshipService = new ScholarshipService();
