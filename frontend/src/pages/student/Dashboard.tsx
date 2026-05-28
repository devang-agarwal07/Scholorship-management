import { useQuery } from '@tanstack/react-query';
import { scholarshipApi } from '../../api/scholarship.api';
import { applicationApi } from '../../api/application.api';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import ApplicationCard from '../../components/ApplicationCard';
import { GraduationCap, FileText, CheckCircle, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/button';

export default function StudentDashboard() {
  const { data: applications } = useQuery({
    queryKey: ['my-applications'],
    queryFn: applicationApi.getMyApplications,
  });

  const { data: scholarships } = useQuery({
    queryKey: ['scholarships', { page: 1, limit: 5 }],
    queryFn: () => scholarshipApi.getAll({ page: 1, limit: 5 }),
  });

  const stats = {
    total: applications?.length || 0,
    approved: applications?.filter((a) => a.status === 'APPROVED' || a.status === 'DISBURSED').length || 0,
    pending: applications?.filter((a) => ['SUBMITTED', 'UNDER_VERIFICATION', 'VERIFICATION_COMPLETE', 'UNDER_REVIEW'].includes(a.status)).length || 0,
    draft: applications?.filter((a) => a.status === 'DRAFT').length || 0,
  };

  return (
    <div className="space-y-6 page-enter">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Student Dashboard</h1>
        <p className="text-muted-foreground">Track your scholarship applications</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Applications', value: stats.total, icon: FileText, color: 'from-blue-500 to-blue-600' },
          { label: 'Approved', value: stats.approved, icon: CheckCircle, color: 'from-emerald-500 to-emerald-600' },
          { label: 'Pending Review', value: stats.pending, icon: Clock, color: 'from-amber-500 to-amber-600' },
          { label: 'Drafts', value: stats.draft, icon: GraduationCap, color: 'from-purple-500 to-purple-600' },
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

      {/* Recent Applications */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">My Applications</h2>
          <Link to="/student/my-applications">
            <Button variant="outline" size="sm">View All</Button>
          </Link>
        </div>
        {applications && applications.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {applications.slice(0, 6).map((app) => (
              <ApplicationCard key={app.id} application={app} />
            ))}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <GraduationCap className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">No applications yet</p>
              <Link to="/student/scholarships">
                <Button>Browse Scholarships</Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Available Scholarships */}
      {scholarships?.scholarships && scholarships.scholarships.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Available Scholarships</h2>
            <Link to="/student/scholarships">
              <Button variant="outline" size="sm">View All</Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {scholarships.scholarships.slice(0, 4).map((s: Record<string, unknown>) => (
              <Card key={s.id as string} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{s.name as string}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{s.description as string}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-emerald-600">
                      ₹{(s.perAwardAmount as number).toLocaleString('en-IN')}
                    </span>
                    <Link to={`/student/apply/${s.id}`}>
                      <Button size="sm">Apply Now</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
