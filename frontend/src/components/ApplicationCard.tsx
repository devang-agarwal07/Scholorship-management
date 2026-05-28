import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import StatusBadge from './StatusBadge';
import { Calendar, DollarSign, FileText } from 'lucide-react';
import type { Application } from '../types';

interface ApplicationCardProps {
  application: Application;
  linkPrefix?: string;
}

export default function ApplicationCard({ application, linkPrefix = '/student' }: ApplicationCardProps) {
  const scholarship = application.scholarship;

  return (
    <Link to={`${linkPrefix}/applications/${application.id}`}>
      <Card className="hover:shadow-lg transition-all duration-200 hover:border-primary/20 cursor-pointer group">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <CardTitle className="text-base group-hover:text-primary transition-colors line-clamp-1">
              {scholarship?.name || 'Scholarship'}
            </CardTitle>
            <StatusBadge status={application.status} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-muted-foreground">
            {scholarship?.perAwardAmount && (
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-500" />
                <span>₹{scholarship.perAwardAmount.toLocaleString('en-IN')}</span>
              </div>
            )}
            {scholarship?.applicationDeadline && (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-500" />
                <span>Deadline: {new Date(scholarship.applicationDeadline).toLocaleDateString('en-IN')}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-purple-500" />
              <span>{application._count?.documents || 0} documents</span>
            </div>
          </div>
          {application.submittedAt && (
            <p className="text-xs text-muted-foreground mt-3 pt-3 border-t">
              Submitted {new Date(application.submittedAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
