import { Badge } from './ui/badge';
import type { ApplicationStatus, DocumentStatus } from '../types';

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info' }> = {
  DRAFT: { label: 'Draft', variant: 'secondary' },
  SUBMITTED: { label: 'Submitted', variant: 'info' },
  UNDER_VERIFICATION: { label: 'Under Verification', variant: 'warning' },
  VERIFICATION_COMPLETE: { label: 'Verified', variant: 'info' },
  UNDER_REVIEW: { label: 'Under Review', variant: 'warning' },
  APPROVED: { label: 'Approved', variant: 'success' },
  REJECTED: { label: 'Rejected', variant: 'destructive' },
  WAITLISTED: { label: 'Waitlisted', variant: 'warning' },
  DISBURSED: { label: 'Disbursed', variant: 'success' },
  PENDING: { label: 'Pending', variant: 'warning' },
  VERIFIED: { label: 'Verified', variant: 'success' },
};

interface StatusBadgeProps {
  status: ApplicationStatus | DocumentStatus | string;
  className?: string;
}

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || { label: status, variant: 'outline' as const };
  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  );
}
