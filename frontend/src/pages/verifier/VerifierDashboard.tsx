import { usePendingDocuments } from '../../hooks/useApplications';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { ClipboardCheck, FileText, Clock, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/button';

export default function VerifierDashboard() {
  const { data } = usePendingDocuments({ page: 1, limit: 50 });

  const pendingCount = data?.total || 0;

  return (
    <div className="space-y-6 page-enter">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Verifier Dashboard</h1>
        <p className="text-muted-foreground">Review and verify submitted documents</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Pending Review', value: pendingCount, icon: Clock, color: 'from-amber-500 to-amber-600' },
          { label: 'Reviewed Today', value: 0, icon: CheckCircle, color: 'from-emerald-500 to-emerald-600' },
          { label: 'Total Documents', value: data?.total || 0, icon: FileText, color: 'from-blue-500 to-blue-600' },
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
            <CardTitle className="flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5" />
              Pending Documents
            </CardTitle>
            <Link to="/verifier/documents">
              <Button variant="outline" size="sm">View All</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {data?.documents && data.documents.length > 0 ? (
            <div className="space-y-3">
              {data.documents.slice(0, 10).map((doc: Record<string, unknown>) => (
                <div
                  key={doc.id as string}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-blue-500" />
                    <div>
                      <p className="text-sm font-medium">{doc.fileName as string}</p>
                      <p className="text-xs text-muted-foreground">
                        {(doc.documentType as string).replace(/_/g, ' ')} · {(doc.application as Record<string, unknown>)?.scholarship ? ((doc.application as Record<string, Record<string, string>>).scholarship.name) : 'N/A'}
                      </p>
                    </div>
                  </div>
                  <Link to={`/verifier/documents?docId=${doc.id}`}>
                    <Button size="sm" variant="outline">Review</Button>
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>All documents have been reviewed!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
