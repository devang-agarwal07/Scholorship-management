export {};

declare global {
  namespace PrismaJson {
    // You can define JSON types here if needed
  }
}

declare module '@prisma/client' {
  export enum Role {
    STUDENT = "STUDENT",
    VERIFIER = "VERIFIER",
    COMMITTEE = "COMMITTEE",
    ADMIN = "ADMIN",
    SUPER_ADMIN = "SUPER_ADMIN"
  }
  
  export enum ApplicationStatus {
    DRAFT = "DRAFT",
    SUBMITTED = "SUBMITTED",
    UNDER_VERIFICATION = "UNDER_VERIFICATION",
    VERIFICATION_COMPLETE = "VERIFICATION_COMPLETE",
    UNDER_REVIEW = "UNDER_REVIEW",
    APPROVED = "APPROVED",
    REJECTED = "REJECTED",
    WAITLISTED = "WAITLISTED",
    DISBURSED = "DISBURSED"
  }
  
  export enum DocumentStatus {
    PENDING = "PENDING",
    VERIFIED = "VERIFIED",
    REJECTED = "REJECTED"
  }
  
  export enum WorkflowStage {
    DOCUMENT_VERIFICATION = "DOCUMENT_VERIFICATION",
    COMMITTEE_REVIEW = "COMMITTEE_REVIEW",
    FINAL_APPROVAL = "FINAL_APPROVAL",
    DISBURSEMENT = "DISBURSEMENT"
  }
}
