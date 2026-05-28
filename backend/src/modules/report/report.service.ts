import prisma from '../../config/database';
import { generatePdfFromHtml, renderReportHtml } from '../../utils/pdfGenerator';

class ReportService {
  async getSummary() {
    const [
      totalApplications,
      totalScholarships,
      totalStudents,
      statusCounts,
      recentApplications,
      scholarshipStats,
    ] = await Promise.all([
      prisma.application.count(),
      prisma.scholarship.count({ where: { isActive: true } }),
      prisma.user.count({ where: { role: 'STUDENT' } }),
      prisma.application.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
      prisma.application.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          student: { include: { profile: { select: { firstName: true, lastName: true } } } },
          scholarship: { select: { name: true } },
        },
      }),
      prisma.scholarship.findMany({
        where: { isActive: true },
        include: {
          _count: { select: { applications: true } },
          applications: {
            where: { status: { in: ['APPROVED', 'DISBURSED'] } },
            select: { id: true },
          },
        },
      }),
    ]);

    const statusBreakdown = statusCounts.reduce(
      (acc, item) => {
        acc[item.status] = item._count.status;
        return acc;
      },
      {} as Record<string, number>
    );

    const totalDisbursed = await prisma.application.count({ where: { status: 'DISBURSED' } });
    const totalApproved = await prisma.application.count({ where: { status: 'APPROVED' } });
    const pendingReview = await prisma.application.count({
      where: { status: { in: ['SUBMITTED', 'UNDER_VERIFICATION', 'VERIFICATION_COMPLETE', 'UNDER_REVIEW'] } },
    });

    const totalDisbursedAmount = scholarshipStats.reduce((sum, s) => {
      const disbursedCount = s.applications.length;
      return sum + disbursedCount * s.perAwardAmount;
    }, 0);

    return {
      kpis: {
        totalApplications,
        totalScholarships,
        totalStudents,
        totalApproved,
        totalDisbursed,
        pendingReview,
        totalDisbursedAmount,
      },
      statusBreakdown,
      recentApplications: recentApplications.map((app) => ({
        id: app.id,
        studentName: app.student.profile
          ? `${app.student.profile.firstName} ${app.student.profile.lastName}`
          : app.student.email,
        scholarshipName: app.scholarship.name,
        status: app.status,
        createdAt: app.createdAt,
      })),
      scholarshipStats: scholarshipStats.map((s) => ({
        id: s.id,
        name: s.name,
        totalApplications: s._count.applications,
        approvedCount: s.applications.length,
        budget: s.totalBudget,
        allocated: s.applications.length * s.perAwardAmount,
        utilization: s.totalBudget > 0
          ? Math.round((s.applications.length * s.perAwardAmount / s.totalBudget) * 100)
          : 0,
      })),
    };
  }

  async getApplicationsReport(filters: {
    scholarshipId?: string;
    status?: string;
    academicYear?: string;
    format?: 'json' | 'csv' | 'pdf';
  }) {
    const where: Record<string, unknown> = {};
    if (filters.scholarshipId) where.scholarshipId = filters.scholarshipId;
    if (filters.status) where.status = filters.status;

    const applications = await prisma.application.findMany({
      where,
      include: {
        student: { include: { profile: true } },
        scholarship: true,
        _count: { select: { documents: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const rows = applications.map((app) => ({
      'Application ID': app.id,
      'Student Name': app.student.profile
        ? `${app.student.profile.firstName} ${app.student.profile.lastName}`
        : app.student.email,
      'Email': app.student.email,
      'Scholarship': app.scholarship.name,
      'Status': app.status,
      'Family Income': app.familyIncome || 'N/A',
      'Documents': app._count.documents,
      'Submitted At': app.submittedAt?.toISOString() || 'Draft',
      'Created At': app.createdAt.toISOString(),
    }));

    if (filters.format === 'csv') {
      return this.generateCsv(rows);
    }

    if (filters.format === 'pdf') {
      const columns = Object.keys(rows[0] || {});
      const html = renderReportHtml('Application Report', rows, columns);
      return generatePdfFromHtml(html);
    }

    return rows;
  }

  async getDisbursementReport(filters: {
    academicYear?: string;
    format?: 'json' | 'csv' | 'pdf';
  }) {
    const where: Record<string, unknown> = {
      status: { in: ['APPROVED', 'DISBURSED'] },
    };

    const applications = await prisma.application.findMany({
      where,
      include: {
        student: { include: { profile: true } },
        scholarship: true,
      },
      orderBy: { scholarship: { name: 'asc' } },
    });

    const rows = applications.map((app) => ({
      'Student Name': app.student.profile
        ? `${app.student.profile.firstName} ${app.student.profile.lastName}`
        : app.student.email,
      'Email': app.student.email,
      'Scholarship': app.scholarship.name,
      'Award Amount': `₹${app.scholarship.perAwardAmount.toLocaleString('en-IN')}`,
      'Status': app.status,
      'Academic Year': app.scholarship.academicYear,
    }));

    // Calculate summary
    const totalDisbursed = applications
      .filter((a) => a.status === 'DISBURSED')
      .reduce((sum, a) => sum + a.scholarship.perAwardAmount, 0);

    const totalApproved = applications
      .filter((a) => a.status === 'APPROVED')
      .reduce((sum, a) => sum + a.scholarship.perAwardAmount, 0);

    if (filters.format === 'csv') {
      return this.generateCsv(rows);
    }

    if (filters.format === 'pdf') {
      const columns = Object.keys(rows[0] || {});
      const html = renderReportHtml('Disbursement Report', rows, columns);
      return generatePdfFromHtml(html);
    }

    return {
      rows,
      summary: {
        totalDisbursedAmount: totalDisbursed,
        totalApprovedAmount: totalApproved,
        totalRecipients: applications.length,
      },
    };
  }

  async getPendingActionsReport() {
    const pendingVerification = await prisma.application.count({
      where: { status: 'UNDER_VERIFICATION' },
    });

    const pendingReview = await prisma.application.count({
      where: { status: 'UNDER_REVIEW' },
    });

    const pendingDisbursement = await prisma.application.count({
      where: { status: 'APPROVED' },
    });

    const pendingDocuments = await prisma.document.count({
      where: { status: 'PENDING' },
    });

    // Find applications stuck for more than 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const stuckApplications = await prisma.application.findMany({
      where: {
        status: {
          in: ['SUBMITTED', 'UNDER_VERIFICATION', 'VERIFICATION_COMPLETE', 'UNDER_REVIEW'],
        },
        updatedAt: { lt: sevenDaysAgo },
      },
      include: {
        student: { include: { profile: { select: { firstName: true, lastName: true } } } },
        scholarship: { select: { name: true } },
      },
    });

    return {
      summary: {
        pendingVerification,
        pendingReview,
        pendingDisbursement,
        pendingDocuments,
        stuckApplications: stuckApplications.length,
      },
      stuckApplications: stuckApplications.map((app) => ({
        id: app.id,
        studentName: app.student.profile
          ? `${app.student.profile.firstName} ${app.student.profile.lastName}`
          : 'Unknown',
        scholarship: app.scholarship.name,
        status: app.status,
        lastUpdated: app.updatedAt,
        daysStuck: Math.floor((Date.now() - app.updatedAt.getTime()) / (24 * 60 * 60 * 1000)),
      })),
    };
  }

  private generateCsv(rows: Record<string, unknown>[]): string {
    if (rows.length === 0) return '';

    const headers = Object.keys(rows[0]);
    const csvHeader = headers.map((h) => `"${h}"`).join(',');
    const csvRows = rows.map((row) =>
      headers.map((h) => `"${String(row[h] ?? '').replace(/"/g, '""')}"`).join(',')
    );

    return [csvHeader, ...csvRows].join('\n');
  }
}

export const reportService = new ReportService();
