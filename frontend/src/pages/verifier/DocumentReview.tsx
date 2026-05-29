import { useState } from 'react';
import { usePendingDocuments, useReviewDocument } from '../../hooks/useApplications';
import { applicationApi } from '../../api/application.api';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Textarea } from '../../components/ui/textarea';
import StatusBadge from '../../components/StatusBadge';
import { FileText, CheckCircle, XCircle, Loader2, ExternalLink } from 'lucide-react';

export default function DocumentReview() {
  const [page, setPage] = useState(1);
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);
  const [remarks, setRemarks] = useState('');
  const { data, isLoading } = usePendingDocuments({ page, limit: 10 });
  const reviewMutation = useReviewDocument();

  const handleReview = async (docId: string, status: 'VERIFIED' | 'REJECTED') => {
    if (status === 'REJECTED' && !remarks.trim()) {
      alert('Remarks are required when rejecting a document.');
      return;
    }
    await reviewMutation.mutateAsync({
      docId,
      data: { status, remarks: remarks || undefined },
    });
    setSelectedDoc(null);
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
        <h1 className="text-2xl font-bold text-slate-800">Document Review</h1>
        <p className="text-muted-foreground">{data?.total || 0} document(s) pending review</p>
      </div>

      <div className="space-y-3">
        {data?.documents?.map((doc: Record<string, unknown>) => {
          const application = doc.application as Record<string, unknown>;
          const student = application?.student as Record<string, unknown>;
          const profile = student?.profile as Record<string, string>;
          const scholarship = application?.scholarship as Record<string, string>;
          const isSelected = selectedDoc === (doc.id as string);

          return (
            <Card key={doc.id as string} className={isSelected ? 'ring-2 ring-primary' : ''}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <FileText className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="font-medium">{doc.fileName as string}</p>
                      <p className="text-sm text-muted-foreground">
                        Type: {(doc.documentType as string).replace(/_/g, ' ')}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Student: {profile ? `${profile.firstName} ${profile.lastName}` : (student?.email as string)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Scholarship: {scholarship?.name || 'N/A'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Uploaded: {new Date(doc.uploadedAt as string).toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={doc.status as string} />
                    <Button size="sm" variant="outline" onClick={async () => {
                      try {
                        const res = await applicationApi.getDocumentSignedUrl(doc.id as string);
                        if (res.signedUrl) {
                          window.open(res.signedUrl, '_blank');
                        } else if (res.s3Url) {
                           // Fallback if the backend returns s3Url directly in dev mode
                           window.open(res.s3Url.startsWith('http') ? res.s3Url : `http://localhost:5000${res.s3Url}`, '_blank');
                        } else {
                           alert('Document URL not available');
                        }
                      } catch (err) {
                        console.error(err);
                        alert('Failed to get document URL');
                      }
                    }}>
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {!isSelected ? (
                  <div className="mt-3 flex gap-2 justify-end">
                    <Button size="sm" variant="outline" onClick={() => setSelectedDoc(doc.id as string)}>
                      Review
                    </Button>
                  </div>
                ) : (
                  <div className="mt-4 pt-4 border-t space-y-3">
                    <Textarea
                      placeholder="Enter remarks (required for rejection)..."
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      rows={3}
                    />
                    <div className="flex gap-2 justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => { setSelectedDoc(null); setRemarks(''); }}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleReview(doc.id as string, 'REJECTED')}
                        disabled={reviewMutation.isPending}
                      >
                        <XCircle className="w-4 h-4 mr-1" /> Reject
                      </Button>
                      <Button
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700"
                        onClick={() => handleReview(doc.id as string, 'VERIFIED')}
                        disabled={reviewMutation.isPending}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" /> Verify
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}

        {(!data?.documents || data.documents.length === 0) && (
          <Card className="border-dashed">
            <CardContent className="py-16 text-center">
              <CheckCircle className="w-16 h-16 text-emerald-200 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">All caught up!</h3>
              <p className="text-muted-foreground">No documents pending review</p>
            </CardContent>
          </Card>
        )}
      </div>

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
          <span className="text-sm text-muted-foreground">Page {page} of {data.totalPages}</span>
          <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={page >= data.totalPages}>Next</Button>
        </div>
      )}
    </div>
  );
}
