import { useState } from 'react';
import { useApplications, useWorkflowAction } from '../../hooks/useApplications';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Textarea } from '../../components/ui/textarea';
import StatusBadge from '../../components/StatusBadge';
import { CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react';

export default function ApplicationReview() {
  const [selectedApp, setSelectedApp] = useState<string | null>(null);
  const [remarks, setRemarks] = useState('');
  const { data, isLoading } = useApplications({ status: 'VERIFICATION_COMPLETE', page: 1, limit: 50 });
  const { data: underReview } = useApplications({ status: 'UNDER_REVIEW', page: 1, limit: 50 });
  const workflowAction = useWorkflowAction();

  const allApps = [
    ...(data?.applications || []),
    ...(underReview?.applications || []),
  ];

  const handleAction = async (applicationId: string, action: string) => {
    if (action === 'REJECT' && !remarks.trim()) {
      alert('Remarks are required when rejecting.');
      return;
    }

    // First move to UNDER_REVIEW if VERIFICATION_COMPLETE
    const app = allApps.find((a: Record<string, unknown>) => a.id === applicationId);
    const currentStatus = (app as Record<string, unknown>)?.status as string;

    if (currentStatus === 'VERIFICATION_COMPLETE') {
      await workflowAction.mutateAsync({
        applicationId,
        data: { action: 'APPROVE', stage: 'COMMITTEE_REVIEW', remarks: 'Moving to committee review' },
      });
    }

    if (action !== 'MOVE_TO_REVIEW') {
      await workflowAction.mutateAsync({
        applicationId,
        data: { action, stage: 'FINAL_APPROVAL', remarks: remarks || undefined },
      });
    }

    setSelectedApp(null);
    setRemarks('');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 page-enter">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Application Review</h1>
        <p className="text-muted-foreground">{allApps.length} application(s) to review</p>
      </div>

      <div className="space-y-3">
        {allApps.map((app: Record<string, unknown>) => {
          const student = app.student as Record<string, unknown>;
          const profile = student?.profile as Record<string, string>;
          const scholarship = app.scholarship as Record<string, unknown>;
          const isSelected = selectedApp === (app.id as string);

          return (
            <Card key={app.id as string} className={isSelected ? 'ring-2 ring-primary' : ''}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">
                      {profile ? `${profile.firstName} ${profile.lastName}` : (student?.email as string)}
                    </p>
                    <p className="text-sm text-muted-foreground">{scholarship?.name as string}</p>
                    <p className="text-sm text-muted-foreground">
                      Income: ₹{((app.familyIncome as number) || 0).toLocaleString('en-IN')} · Docs: {(app._count as Record<string, number>)?.documents || 0}
                    </p>
                  </div>
                  <StatusBadge status={app.status as string} />
                </div>

                {app.personalStatement && (
                  <p className="text-sm mt-3 p-3 bg-slate-50 rounded-lg line-clamp-3 italic text-slate-600">
                    "{app.personalStatement as string}"
                  </p>
                )}

                {!isSelected ? (
                  <div className="mt-3 flex gap-2 justify-end">
                    <Button size="sm" variant="outline" onClick={() => setSelectedApp(app.id as string)}>
                      Review
                    </Button>
                  </div>
                ) : (
                  <div className="mt-4 pt-4 border-t space-y-3">
                    <Textarea
                      placeholder="Enter remarks..."
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      rows={3}
                    />
                    <div className="flex gap-2 justify-end flex-wrap">
                      <Button size="sm" variant="outline" onClick={() => { setSelectedApp(null); setRemarks(''); }}>
                        Cancel
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => handleAction(app.id as string, 'WAITLIST')} disabled={workflowAction.isPending}>
                        <Clock className="w-4 h-4 mr-1" /> Waitlist
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleAction(app.id as string, 'REJECT')} disabled={workflowAction.isPending}>
                        <XCircle className="w-4 h-4 mr-1" /> Reject
                      </Button>
                      <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => handleAction(app.id as string, 'APPROVE')} disabled={workflowAction.isPending}>
                        <CheckCircle className="w-4 h-4 mr-1" /> Approve
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}

        {allApps.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="py-16 text-center">
              <CheckCircle className="w-16 h-16 text-emerald-200 mx-auto mb-4" />
              <h3 className="text-lg font-medium">All caught up!</h3>
              <p className="text-muted-foreground">No applications pending review</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
