import { useAuthStore } from '../../store/authStore';
import { useLogout } from '../../hooks/useAuth';
import { Bell, LogOut, User } from 'lucide-react';
import { Button } from '../ui/button';

export default function Navbar() {
  const user = useAuthStore((s) => s.user);
  const logoutMutation = useLogout();

  const roleLabels: Record<string, string> = {
    STUDENT: 'Student',
    VERIFIER: 'Verifier',
    COMMITTEE: 'Committee',
    ADMIN: 'Admin',
    SUPER_ADMIN: 'Super Admin',
  };

  return (
    <header className="h-16 border-b bg-white/80 backdrop-blur-md sticky top-0 z-20 flex items-center justify-between px-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-800">
          Welcome back{user?.profile ? `, ${user.profile.firstName}` : ''}
        </h2>
        <p className="text-xs text-muted-foreground">
          {user?.role ? roleLabels[user.role] : ''} Portal
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5 text-slate-600" />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center font-bold">
            3
          </span>
        </Button>

        <div className="flex items-center gap-2 pl-3 border-l">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-slate-700">
              {user?.profile ? `${user.profile.firstName} ${user.profile.lastName}` : user?.email}
            </p>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => logoutMutation.mutate()}
          className="text-slate-500 hover:text-red-500"
        >
          <LogOut className="w-5 h-5" />
        </Button>
      </div>
    </header>
  );
}
