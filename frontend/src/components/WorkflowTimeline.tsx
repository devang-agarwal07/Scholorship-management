import { CheckCircle, XCircle, Clock, ArrowRight } from 'lucide-react';
import type { WorkflowAction } from '../types';
import { cn } from '../lib/utils';

interface WorkflowTimelineProps {
  history: WorkflowAction[];
  currentStatus: string;
}

const stageLabels: Record<string, string> = {
  DOCUMENT_VERIFICATION: 'Document Verification',
  COMMITTEE_REVIEW: 'Committee Review',
  FINAL_APPROVAL: 'Final Approval',
  DISBURSEMENT: 'Disbursement',
};

const actionIcons: Record<string, React.ElementType> = {
  APPROVE: CheckCircle,
  VERIFY: CheckCircle,
  REJECT: XCircle,
  WAITLIST: Clock,
  DISBURSE: CheckCircle,
  REQUEST_CHANGES: ArrowRight,
};

const actionColors: Record<string, string> = {
  APPROVE: 'text-emerald-500',
  VERIFY: 'text-emerald-500',
  REJECT: 'text-red-500',
  WAITLIST: 'text-amber-500',
  DISBURSE: 'text-emerald-600',
  REQUEST_CHANGES: 'text-blue-500',
};

export default function WorkflowTimeline({ history, currentStatus }: WorkflowTimelineProps) {
  if (history.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p className="text-sm">No workflow actions yet</p>
        <p className="text-xs mt-1">Current status: {currentStatus.replace(/_/g, ' ')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {history.map((action, index) => {
        const Icon = actionIcons[action.action] || Clock;
        const color = actionColors[action.action] || 'text-slate-400';
        const isLast = index === history.length - 1;

        return (
          <div key={action.id} className="flex gap-4">
            {/* Timeline line */}
            <div className="flex flex-col items-center">
              <div className={cn('w-8 h-8 rounded-full flex items-center justify-center bg-white border-2', color.replace('text-', 'border-'))}>
                <Icon className={cn('w-4 h-4', color)} />
              </div>
              {!isLast && <div className="w-0.5 h-full min-h-[40px] bg-slate-200" />}
            </div>

            {/* Content */}
            <div className={cn('pb-6', isLast && 'pb-0')}>
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">
                  {action.action.replace(/_/g, ' ')}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                  {stageLabels[action.stage] || action.stage}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                by {action.actor?.profile
                  ? `${action.actor.profile.firstName} ${action.actor.profile.lastName}`
                  : action.actor?.email || 'System'
                }
                {' · '}
                {new Date(action.createdAt).toLocaleString('en-IN', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </p>
              {action.remarks && (
                <p className="text-sm mt-2 p-2 rounded bg-slate-50 border text-slate-600 italic">
                  "{action.remarks}"
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
