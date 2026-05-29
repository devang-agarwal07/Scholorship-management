import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import prisma from '../../config/database';
import { generatePdfFromHtml, renderReportHtml } from '../../utils/pdfGenerator';

interface ReportJobData {
  type: string;
  filters: Record<string, unknown>;
  requestedBy: string;
}

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

async function generateReport(data: ReportJobData): Promise<Buffer> {
  const { type, filters } = data;

  switch (type) {
    case 'application_summary': {
      const whereClause: Record<string, unknown> = {};
      if (filters.scholarshipId) whereClause.scholarshipId = filters.scholarshipId;
      if (filters.status) whereClause.status = filters.status;
      if (filters.academicYear) {
        whereClause.scholarship = { academicYear: filters.academicYear };
      }

      const applications = await prisma.application.findMany({
        where: whereClause,
        include: {
          student: { include: { profile: true } },
          scholarship: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      const rows = applications.map((app) => ({
        'Application ID': app.id.slice(0, 8),
        'Student': app.student.profile
          ? `${app.student.profile.firstName} ${app.student.profile.lastName}`
          : app.student.email,
        'Scholarship': app.scholarship.name,
        'Status': app.status,
        'Submitted': app.submittedAt?.toLocaleDateString('en-IN') || 'Draft',
        'Family Income': app.familyIncome ? `₹${app.familyIncome.toLocaleString('en-IN')}` : 'N/A',
      }));

      const html = renderReportHtml(
        'Application Summary Report',
        rows,
        ['Application ID', 'Student', 'Scholarship', 'Status', 'Submitted', 'Family Income']
      );

      return generatePdfFromHtml(html);
    }

    case 'disbursement': {
      const disbursed = await prisma.application.findMany({
        where: { status: 'DISBURSED' },
        include: {
          student: { include: { profile: true } },
          scholarship: true,
        },
      });

      const rows = disbursed.map((app) => ({
        'Student': app.student.profile
          ? `${app.student.profile.firstName} ${app.student.profile.lastName}`
          : app.student.email,
        'Scholarship': app.scholarship.name,
        'Amount': `₹${app.scholarship.perAwardAmount.toLocaleString('en-IN')}`,
        'Academic Year': app.scholarship.academicYear,
      }));

      const html = renderReportHtml(
        'Disbursement Report',
        rows,
        ['Student', 'Scholarship', 'Amount', 'Academic Year']
      );

      return generatePdfFromHtml(html);
    }

    default:
      throw new Error(`Unknown report type: ${type}`);
  }
}

export function startReportWorker(): Worker | null {
  try {
    const connection = new IORedis(REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      lazyConnect: true,
    });

    const worker = new Worker<ReportJobData>(
      'report',
      async (job: Job<ReportJobData>) => {
        console.log(`📊 Generating report: ${job.data.type}`);
        const pdfBuffer = await generateReport(job.data);
        console.log(`✅ Report generated: ${job.data.type} (${pdfBuffer.length} bytes)`);
        return { size: pdfBuffer.length };
      },
      { connection: connection as any, concurrency: 2 }
    );

    worker.on('failed', (job, err) => {
      console.error(`Report job ${job?.id} failed:`, err.message);
    });

    console.log('📊 Report worker started');
    return worker;
  } catch {
    console.warn('⚠️ Report worker could not start (Redis unavailable)');
    return null;
  }
}
