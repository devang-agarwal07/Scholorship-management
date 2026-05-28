import { useMyApplications } from '../../hooks/useApplications';
import ApplicationCard from '../../components/ApplicationCard';
import { Card, CardContent } from '../../components/ui/card';
import { GraduationCap, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/button';

export default function MyApplications() {
  const { data: applications, isLoading } = useMyApplications();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 page-enter">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">My Applications</h1>
          <p className="text-muted-foreground">{applications?.length || 0} application(s)</p>
        </div>
        <Link to="/student/scholarships">
          <Button>Browse Scholarships</Button>
        </Link>
      </div>

      {applications && applications.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {applications.map((app) => (
            <ApplicationCard key={app.id} application={app} />
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <GraduationCap className="w-16 h-16 text-slate-200 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No applications yet</h3>
            <p className="text-muted-foreground mb-6">Start by browsing available scholarships</p>
            <Link to="/student/scholarships">
              <Button size="lg">Browse Scholarships</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
