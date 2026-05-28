import { useQuery } from '@tanstack/react-query';
import { reportApi } from '../../api/report.api';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import StatusBadge from '../../components/StatusBadge';
import { BarChart3, Users, GraduationCap, DollarSign, FileText, Clock, TrendingUp, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const CHART_COLORS = ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#22c55e', '#ef4444', '#f59e0b', '#3b82f6', '#10b981'];

export default function AdminDashboard() {
  const { data: summary, isLoading } = useQuery({
    queryKey: ['report-summary'],
    queryFn: reportApi.getSummary,
  });

  const statusData = summary?.statusBreakdown
    ? Object.entries(summary.statusBreakdown).map(([name, value], idx) => ({
        name: name.replace(/_/g, ' '),
        value,
        color: CHART_COLORS[idx % CHART_COLORS.length],
      }))
    : [];

  return (
    <div className="space-y-6 page-enter">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Admin Dashboard</h1>
          <p className="text-muted-foreground">System overview and analytics</p>
        </div>
        <Link to="/admin/reports">
          <Button variant="outline"><BarChart3 className="w-4 h-4 mr-2" /> View Reports</Button>
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Applications', value: summary?.kpis.totalApplications || 0, icon: FileText, color: 'from-blue-500 to-blue-600' },
          { label: 'Active Scholarships', value: summary?.kpis.totalScholarships || 0, icon: GraduationCap, color: 'from-purple-500 to-purple-600' },
          { label: 'Total Students', value: summary?.kpis.totalStudents || 0, icon: Users, color: 'from-indigo-500 to-indigo-600' },
          { label: 'Amount Disbursed', value: `₹${((summary?.kpis.totalDisbursedAmount || 0) / 100000).toFixed(1)}L`, icon: DollarSign, color: 'from-emerald-500 to-emerald-600' },
        ].map((stat) => (
          <Card key={stat.label} className="border-0 shadow-md overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Breakdown Pie */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><TrendingUp className="w-5 h-5" /> Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {statusData.length > 0 ? (
              <div className="flex items-center gap-6">
                <ResponsiveContainer width={200} height={200}>
                  <PieChart>
                    <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value">
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2">
                  {statusData.map((entry) => (
                    <div key={entry.name} className="flex items-center gap-2 text-sm">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                      <span className="text-muted-foreground">{entry.name}</span>
                      <span className="font-semibold ml-auto">{entry.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-center py-8 text-muted-foreground">No data available</p>
            )}
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Clock className="w-5 h-5" /> Quick Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-amber-50">
              <span className="text-sm font-medium text-amber-800">Pending Review</span>
              <span className="text-lg font-bold text-amber-600">{summary?.kpis.pendingReview || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50">
              <span className="text-sm font-medium text-emerald-800">Approved</span>
              <span className="text-lg font-bold text-emerald-600">{summary?.kpis.totalApproved || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50">
              <span className="text-sm font-medium text-blue-800">Disbursed</span>
              <span className="text-lg font-bold text-blue-600">{summary?.kpis.totalDisbursed || 0}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Applications */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Applications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-2 font-medium text-muted-foreground">Student</th>
                  <th className="text-left py-3 px-2 font-medium text-muted-foreground">Scholarship</th>
                  <th className="text-left py-3 px-2 font-medium text-muted-foreground">Status</th>
                  <th className="text-left py-3 px-2 font-medium text-muted-foreground">Date</th>
                </tr>
              </thead>
              <tbody>
                {summary?.recentApplications?.map((app) => (
                  <tr key={app.id} className="border-b last:border-0 hover:bg-slate-50">
                    <td className="py-3 px-2 font-medium">{app.studentName}</td>
                    <td className="py-3 px-2 text-muted-foreground">{app.scholarshipName}</td>
                    <td className="py-3 px-2"><StatusBadge status={app.status} /></td>
                    <td className="py-3 px-2 text-muted-foreground">{new Date(app.createdAt).toLocaleDateString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
