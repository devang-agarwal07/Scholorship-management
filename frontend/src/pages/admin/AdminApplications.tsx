import { useApplications } from '../../hooks/useApplications';
import StatusBadge from '../../components/StatusBadge';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Loader2 } from 'lucide-react';

export default function AdminApplications() {
  const { data, isLoading } = useApplications({ page: 1, limit: 100 });

  if (isLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6 page-enter">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">All Applications</h1>
        <p className="text-muted-foreground">{data?.total || 0} total application(s)</p>
      </div>
      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-slate-50">
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Student</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Scholarship</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Submitted</th>
              </tr>
            </thead>
            <tbody>
              {data?.applications?.map((app: Record<string, unknown>) => {
                const student = app.student as Record<string, unknown>;
                const profile = student?.profile as Record<string, string>;
                const scholarship = app.scholarship as Record<string, string>;
                return (
                  <tr key={app.id as string} className="border-b last:border-0 hover:bg-slate-50">
                    <td className="py-3 px-4 font-medium">{profile ? `${profile.firstName} ${profile.lastName}` : (student?.email as string)}</td>
                    <td className="py-3 px-4 text-muted-foreground">{scholarship?.name}</td>
                    <td className="py-3 px-4"><StatusBadge status={app.status as string} /></td>
                    <td className="py-3 px-4 text-muted-foreground">{app.submittedAt ? new Date(app.submittedAt as string).toLocaleDateString('en-IN') : 'Draft'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
