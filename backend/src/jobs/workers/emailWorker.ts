import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import nodemailer from 'nodemailer';

interface EmailJobData {
  to: string;
  subject: string;
  template: string;
  context: Record<string, unknown>;
}

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

const EMAIL_TEMPLATES: Record<string, (ctx: Record<string, unknown>) => string> = {
  application_submitted: (ctx) => `
    <h2>Application Submitted Successfully</h2>
    <p>Dear ${ctx.studentName},</p>
    <p>Your application for <strong>${ctx.scholarshipName}</strong> has been submitted successfully.</p>
    <p>Application ID: ${ctx.applicationId}</p>
    <p>We will review your documents and notify you of the next steps.</p>
    <p>Best regards,<br/>Scholarship Management System</p>
  `,
  docs_verified: (ctx) => `
    <h2>Documents Verified</h2>
    <p>Dear ${ctx.studentName},</p>
    <p>All your documents for <strong>${ctx.scholarshipName}</strong> have been verified successfully.</p>
    <p>Your application will now be forwarded for committee review.</p>
    <p>Best regards,<br/>Scholarship Management System</p>
  `,
  approved: (ctx) => `
    <h2>Application Approved!</h2>
    <p>Dear ${ctx.studentName},</p>
    <p>Congratulations! Your application for <strong>${ctx.scholarshipName}</strong> has been approved.</p>
    <p>Award Amount: ₹${ctx.amount}</p>
    <p>The disbursement process will begin shortly.</p>
    <p>Best regards,<br/>Scholarship Management System</p>
  `,
  rejected: (ctx) => `
    <h2>Application Update</h2>
    <p>Dear ${ctx.studentName},</p>
    <p>We regret to inform you that your application for <strong>${ctx.scholarshipName}</strong> could not be approved at this time.</p>
    ${ctx.remarks ? `<p>Remarks: ${ctx.remarks}</p>` : ''}
    <p>You may apply for other available scholarships.</p>
    <p>Best regards,<br/>Scholarship Management System</p>
  `,
  new_assignment: (ctx) => `
    <h2>New Document Review Assignment</h2>
    <p>Dear Verifier,</p>
    <p>A new application (${ctx.applicationId}) requires document verification for <strong>${ctx.scholarshipName}</strong>.</p>
    <p>Please log in to review the documents.</p>
    <p>Best regards,<br/>Scholarship Management System</p>
  `,
  pending_review: (ctx) => `
    <h2>Pending Review Reminder</h2>
    <p>Dear Committee Member,</p>
    <p>There are <strong>${ctx.pendingCount}</strong> applications pending your review.</p>
    <p>Please log in to the system to review them at your earliest convenience.</p>
    <p>Best regards,<br/>Scholarship Management System</p>
  `,
};

function getEmailHtml(template: string, context: Record<string, unknown>): string {
  const templateFn = EMAIL_TEMPLATES[template];
  if (templateFn) {
    return templateFn(context);
  }
  return `<p>${JSON.stringify(context)}</p>`;
}

export function startEmailWorker(): Worker | null {
  try {
    const connection = new IORedis(REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      lazyConnect: true,
    });

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.ethereal.email',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
      },
    });

    const worker = new Worker<EmailJobData>(
      'email',
      async (job: Job<EmailJobData>) => {
        const { to, subject, template, context } = job.data;
        const html = getEmailHtml(template, context);

        await transporter.sendMail({
          from: process.env.FROM_EMAIL || 'no-reply@scholarship.edu',
          to,
          subject,
          html,
        });

        console.log(`✉️ Email sent to ${to}: ${subject}`);
      },
      { connection: connection as any, concurrency: 5 }
    );

    worker.on('failed', (job, err) => {
      console.error(`Email job ${job?.id} failed:`, err.message);
    });

    console.log('📧 Email worker started');
    return worker;
  } catch {
    console.warn('⚠️ Email worker could not start (Redis unavailable)');
    return null;
  }
}
