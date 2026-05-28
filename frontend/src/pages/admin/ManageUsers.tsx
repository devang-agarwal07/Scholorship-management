import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Users, Shield } from 'lucide-react';

export default function ManageUsers() {
  const mockUsers = [
    { email: 'admin@scholarship.edu', role: 'SUPER_ADMIN', name: 'System Administrator' },
    { email: 'verifier@scholarship.edu', role: 'VERIFIER', name: 'Priya Sharma' },
    { email: 'committee@scholarship.edu', role: 'COMMITTEE', name: 'Rajesh Kumar' },
    { email: 'student@scholarship.edu', role: 'STUDENT', name: 'Ananya Patel' },
  ];

  const roleColors: Record<string, string> = {
    SUPER_ADMIN: 'bg-red-100 text-red-800',
    ADMIN: 'bg-purple-100 text-purple-800',
    COMMITTEE: 'bg-blue-100 text-blue-800',
    VERIFIER: 'bg-amber-100 text-amber-800',
    STUDENT: 'bg-emerald-100 text-emerald-800',
  };

  return (
    <div className="space-y-6 page-enter">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Manage Users</h1>
        <p className="text-muted-foreground">View and manage system users</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Users className="w-5 h-5" /> System Users</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">User</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Email</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Role</th>
              </tr>
            </thead>
            <tbody>
              {mockUsers.map((user) => (
                <tr key={user.email} className="border-b last:border-0 hover:bg-slate-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center">
                        <Shield className="w-4 h-4 text-white" />
                      </div>
                      <span className="font-medium">{user.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">{user.email}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${roleColors[user.role]}`}>
                      {user.role.replace(/_/g, ' ')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
