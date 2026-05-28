// ─── Enums ──────────────────────────────────────────────
export type Role = 'STUDENT' | 'VERIFIER' | 'COMMITTEE' | 'ADMIN' | 'SUPER_ADMIN';

export type ApplicationStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_VERIFICATION'
  | 'VERIFICATION_COMPLETE'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'WAITLISTED'
  | 'DISBURSED';

export type DocumentStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';

export type WorkflowStage =
  | 'DOCUMENT_VERIFICATION'
  | 'COMMITTEE_REVIEW'
  | 'FINAL_APPROVAL'
  | 'DISBURSEMENT';

// ─── User ───────────────────────────────────────────────
export interface Profile {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  phone?: string;
  dateOfBirth?: string;
  address?: string;
  institution?: string;
  department?: string;
  yearOfStudy?: number;
  cgpa?: number;
  avatarUrl?: string;
}

export interface User {
  id: string;
  email: string;
  role: Role;
  profile?: Profile | null;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  message: string;
}

// ─── Scholarship ────────────────────────────────────────
export interface EligibilityCriteria {
  minCgpa?: number;
  maxFamilyIncome?: number;
  allowedDepartments?: string[];
  allowedYears?: number[];
  minYearOfStudy?: number;
  maxYearOfStudy?: number;
}

export interface Scholarship {
  id: string;
  name: string;
  description: string;
  totalBudget: number;
  perAwardAmount: number;
  maxAwardees: number;
  eligibilityCriteria: EligibilityCriteria;
  requiredDocuments: string[];
  applicationDeadline: string;
  academicYear: string;
  isActive: boolean;
  _count?: { applications: number };
  approvedCount?: number;
  allocatedBudget?: number;
  remainingBudget?: number;
  utilizationPercentage?: number;
  createdAt: string;
  updatedAt: string;
}

// ─── Application ────────────────────────────────────────
export interface Application {
  id: string;
  studentId: string;
  student?: User;
  scholarshipId: string;
  scholarship?: Scholarship;
  status: ApplicationStatus;
  personalStatement?: string;
  familyIncome?: number;
  academicDetails?: Record<string, unknown>;
  submittedAt?: string;
  documents?: Document[];
  workflowStages?: WorkflowAction[];
  _count?: { documents: number; workflowStages: number };
  createdAt: string;
  updatedAt: string;
}

// ─── Document ───────────────────────────────────────────
export interface Document {
  id: string;
  applicationId: string;
  documentType: string;
  fileName: string;
  s3Key: string;
  s3Url: string;
  status: DocumentStatus;
  reviews?: DocumentReview[];
  uploadedAt: string;
}

export interface DocumentReview {
  id: string;
  documentId: string;
  reviewerId: string;
  reviewer?: User;
  status: DocumentStatus;
  remarks?: string;
  reviewedAt: string;
}

// ─── Workflow ───────────────────────────────────────────
export interface WorkflowAction {
  id: string;
  applicationId: string;
  actorId: string;
  actor?: User;
  stage: WorkflowStage;
  action: string;
  remarks?: string;
  createdAt: string;
}

// ─── Notification ───────────────────────────────────────
export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

// ─── Report ─────────────────────────────────────────────
export interface ReportSummary {
  kpis: {
    totalApplications: number;
    totalScholarships: number;
    totalStudents: number;
    totalApproved: number;
    totalDisbursed: number;
    pendingReview: number;
    totalDisbursedAmount: number;
  };
  statusBreakdown: Record<string, number>;
  recentApplications: {
    id: string;
    studentName: string;
    scholarshipName: string;
    status: ApplicationStatus;
    createdAt: string;
  }[];
  scholarshipStats: {
    id: string;
    name: string;
    totalApplications: number;
    approvedCount: number;
    budget: number;
    allocated: number;
    utilization: number;
  }[];
}

// ─── Paginated Response ─────────────────────────────────
export interface PaginatedResponse<T> {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  scholarships?: T[];
  applications?: T[];
  documents?: T[];
  notifications?: T[];
}
