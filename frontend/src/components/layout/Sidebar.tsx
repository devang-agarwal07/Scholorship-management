import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import {
  LayoutDashboard, GraduationCap, FileText, Users, BarChart3,
  ClipboardCheck, Shield, ChevronLeft, ChevronRight
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useState } from 'react';
import type { Role } from '../../types';

interface NavItem {
  label: string;
  path: string;
  icon: React.ElementType;
  roles: Role[];
}

const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/student/dashboard', icon: LayoutDashboard, roles: ['STUDENT'] },
  { label: 'Scholarships', path: '/student/scholarships', icon: GraduationCap, roles: ['STUDENT'] },
  { label: 'My Applications', path: '/student/my-applications', icon: FileText, roles: ['STUDENT'] },
  { label: 'Dashboard', path: '/verifier/dashboard', icon: LayoutDashboard, roles: ['VERIFIER'] },
  { label: 'Review Documents', path: '/verifier/documents', icon: ClipboardCheck, roles: ['VERIFIER'] },
  { label: 'Dashboard', path: '/committee/dashboard', icon: LayoutDashboard, roles: ['COMMITTEE'] },
  { label: 'Review Apps', path: '/committee/review', icon: FileText, roles: ['COMMITTEE'] },
  { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'SUPER_ADMIN'] },
  { label: 'Scholarships', path: '/admin/scholarships', icon: GraduationCap, roles: ['ADMIN', 'SUPER_ADMIN'] },
  { label: 'Users', path: '/admin/users', icon: Users, roles: ['ADMIN', 'SUPER_ADMIN'] },
  { label: 'Reports', path: '/admin/reports', icon: BarChart3, roles: ['ADMIN', 'SUPER_ADMIN'] },
  { label: 'All Applications', path: '/admin/applications', icon: FileText, roles: ['ADMIN', 'SUPER_ADMIN'] },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const user = useAuthStore((s) => s.user);

  const filteredItems = navItems.filter((item) =>
    user ? item.roles.includes(user.role) : false
  );

  return (
    <aside
      className={cn(
        'h-screen sticky top-0 flex flex-col bg-gradient-to-b from-slate-900 to-slate-800 text-white transition-all duration-300 z-30',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-white/10">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
          <Shield className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <span className="font-bold text-lg truncate">ScholarHub</span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {filteredItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-white/15 text-white shadow-lg shadow-white/5'
                  : 'text-slate-300 hover:bg-white/10 hover:text-white'
              )}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-center h-12 border-t border-white/10 hover:bg-white/10 transition-colors"
      >
        {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
      </button>
    </aside>
  );
}
