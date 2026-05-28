import { useApplications } from '../../hooks/useApplications';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import StatusBadge from '../../components/StatusBadge';
import { FileText, Clock, CheckCircle, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/button';

export default function CommitteeDashboard() {
  const { data: underReview } = useApplications({ status: 'UNDER_REVIEW', page: 1, limit: 50 });
  const { data: verComplete } = useApplications({ status: 'VERIFICATION_COMPLETE', page: 1, limit: 50 });

  const reviewCount = underReview?.total || 0;
  const readyCount = verComplete?.total || 0;

  return (
    <div className="space-y-6 page-enter">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Committee Dashboard</h1>
        <p className="text-muted-foreground">Review and approve scholarship applications</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Ready for Review', value: readyCount, icon: FileText, color: 'from-blue-500 to-blue-600' },
          { label: 'Under Review', value: reviewCount, icon: Clock, color: 'from-amber-500 to-amber-600' },
          { label: 'Total Queue', value: readyCount + reviewCount, icon: Users, color: 'from-purple-500 to-purple-600' },
        ].map((stat) => (
          <Card key={stat.label} className="border-0 shadow-md">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-3xl font-bold mt-1">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Applications Ready for Review</CardTitle>
            <Link to="/committee/review">
              <Button variant="outline" size="sm">Review All</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {verComplete?.applications && verComplete.applications.length > 0 ? (
            <div className="space-y-3">
              {verComplete.applications.slice(0, 10).map((app: Record<string, unknown>) => {
                const student = app.student as Record<string, unknown>;
                const profile = student?.profile as Record<string, string>;
                const scholarship = app.scholarship as Record<string, string>;
                return (
                  <div key={app.id as string} className="flex items-center justify-between p-3 rounded-lg border hover:bg-slate-50 transition-colors">
                    <div>
                      <p className="text-sm font-medium">
                        {profile ? `${profile.firstName} ${profile.lastName}` : (student?.email as string)}
                      </p>
                      <p className="text-xs text-muted-foreground">{scholarship?.name}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={app.status as string} />
                      <Link to={`/committee/review?appId=${app.id}`}>
                        <Button size="sm">Review</Button>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No applications pending review</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
