import prisma from '../../config/database';

class NotificationService {
  async send(userId: string, title: string, message: string): Promise<void> {
    await prisma.notification.create({
      data: { userId, title, message },
    });
  }

  async getUserNotifications(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where: { userId } }),
    ]);

    const unreadCount = await prisma.notification.count({
      where: { userId, isRead: false },
    });

    return { notifications, total, unreadCount, page, limit };
  }

  async markAsRead(notificationId: string, userId: string): Promise<void> {
    await prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: string): Promise<void> {
    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  async notifyStatusChange(applicationId: string, newStatus: string): Promise<void> {
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: { student: true, scholarship: true },
    });

    if (!application) return;

    const statusMessages: Record<string, string> = {
      SUBMITTED: `Your application for "${application.scholarship.name}" has been submitted successfully.`,
      UNDER_VERIFICATION: `Your documents for "${application.scholarship.name}" are being verified.`,
      VERIFICATION_COMPLETE: `All documents for "${application.scholarship.name}" have been verified.`,
      UNDER_REVIEW: `Your application for "${application.scholarship.name}" is under committee review.`,
      APPROVED: `Congratulations! Your application for "${application.scholarship.name}" has been approved!`,
      REJECTED: `We regret to inform you that your application for "${application.scholarship.name}" has been rejected.`,
      WAITLISTED: `Your application for "${application.scholarship.name}" has been waitlisted.`,
      DISBURSED: `The scholarship amount for "${application.scholarship.name}" has been disbursed to your account.`,
    };

    const message = statusMessages[newStatus] || `Your application status has changed to ${newStatus}.`;

    await this.send(
      application.studentId,
      `Application Status: ${newStatus.replace(/_/g, ' ')}`,
      message
    );
  }
}

export const notificationService = new NotificationService();
