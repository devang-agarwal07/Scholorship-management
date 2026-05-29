// ─── Runtime Enum Constants for MongoDB (String-based fields) ─────────────
// MongoDB Prisma provider does not generate native enums.
// These constants provide runtime values used throughout the backend.

export const Role = {
  STUDENT: 'STUDENT',
  VERIFIER: 'VERIFIER',
  COMMITTEE: 'COMMITTEE',
  ADMIN: 'ADMIN',
  SUPER_ADMIN: 'SUPER_ADMIN',
} as const;
export type Role = (typeof Role)[keyof typeof Role];

export const ApplicationStatus = {
  DRAFT: 'DRAFT',
  SUBMITTED: 'SUBMITTED',
  UNDER_VERIFICATION: 'UNDER_VERIFICATION',
  VERIFICATION_COMPLETE: 'VERIFICATION_COMPLETE',
  UNDER_REVIEW: 'UNDER_REVIEW',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  WAITLISTED: 'WAITLISTED',
  DISBURSED: 'DISBURSED',
} as const;
export type ApplicationStatus = (typeof ApplicationStatus)[keyof typeof ApplicationStatus];

export const DocumentStatus = {
  PENDING: 'PENDING',
  VERIFIED: 'VERIFIED',
  REJECTED: 'REJECTED',
} as const;
export type DocumentStatus = (typeof DocumentStatus)[keyof typeof DocumentStatus];

export const WorkflowStage = {
  DOCUMENT_VERIFICATION: 'DOCUMENT_VERIFICATION',
  COMMITTEE_REVIEW: 'COMMITTEE_REVIEW',
  FINAL_APPROVAL: 'FINAL_APPROVAL',
  DISBURSEMENT: 'DISBURSEMENT',
} as const;
export type WorkflowStage = (typeof WorkflowStage)[keyof typeof WorkflowStage];
