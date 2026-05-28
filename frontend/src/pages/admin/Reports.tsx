import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportApi, downloadBlob } from '../../api/report.api';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { BarChart3, Download, FileText } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#6366f1', '#8b5cf6', '#22c55e', '#ef4444', '#f59e0b', '#3b82f6', '#10b981', '#a78bfa', '#c4b5fd'];

export default function Reports() {
  const [activeTab, setActiveTab] = useState<'summary' | 'applications' | 'disbursement'>('summary');
  const { data: summary } = useQuery({ queryKey: ['report-summary'], queryFn: reportApi.getSummary });

  const statusData = summary?.statusBreakdown
    ? Object.entries(summary.statusBreakdown).map(([name, value], i) => ({ name: name.replace(/_/g, ' '), value, fill: COLORS[i % COLORS.length] }))
    : [];

  const scholarshipData = summary?.scholarshipStats?.map((s) => ({
    name: s.name.length > 20 ? s.name.slice(0, 20) + '...' : s.name,
    applications: s.totalApplications, approved: s.approvedCount, utilization: s.utilization,
  })) || [];

  const handleExport = async (type: string, format: 'csv' | 'pdf') => {
    try {
      const blob = type === 'applications'
        ? await reportApi.getApplicationsReport({ format })
        : await reportApi.getDisbursementReport({ format });
      downloadBlob(blob, `${type}_report.${format}`);
    } catch (e) { console.error('Export failed', e); }
  };

  return (
    <div className="space-y-6 page-enter">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Reports & Analytics</h1>
        <p className="text-muted-foreground">Generate and export reports</p>
      </div>

      <div className="flex gap-2">
        {(['summary', 'applications', 'disbursement'] as const).map((tab) => (
          <Button key={tab} variant={activeTab === tab ? 'default' : 'outline'} size="sm" onClick={() => setActiveTab(tab)}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </Button>
        ))}
      </div>

      {activeTab === 'summary' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle>Applications by Status</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Scholarship Performance</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={scholarshipData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" fontSize={12} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="applications" fill="#6366f1" name="Total Apps" />
                  <Bar dataKey="approved" fill="#22c55e" name="Approved" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'applications' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2"><FileText className="w-5 h-5" /> Application Report</CardTitle>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => handleExport('applications', 'csv')}><Download className="w-4 h-4 mr-1" /> CSV</Button>
                <Button size="sm" variant="outline" onClick={() => handleExport('applications', 'pdf')}><Download className="w-4 h-4 mr-1" /> PDF</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-center py-8">Click CSV or PDF to export the full application report.</p>
          </CardContent>
        </Card>
      )}

      {activeTab === 'disbursement' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2"><BarChart3 className="w-5 h-5" /> Disbursement Report</CardTitle>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => handleExport('disbursement', 'csv')}><Download className="w-4 h-4 mr-1" /> CSV</Button>
                <Button size="sm" variant="outline" onClick={() => handleExport('disbursement', 'pdf')}><Download className="w-4 h-4 mr-1" /> PDF</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-center py-8">Click CSV or PDF to export the disbursement report.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
