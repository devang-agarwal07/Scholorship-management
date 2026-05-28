import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import DashboardLayout from './components/layout/DashboardLayout';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Student Pages
import StudentDashboard from './pages/student/Dashboard';
import ScholarshipList from './pages/student/ScholarshipList';
import Apply from './pages/student/Apply';
import MyApplications from './pages/student/MyApplications';

// Verifier Pages
import VerifierDashboard from './pages/verifier/VerifierDashboard';
import DocumentReview from './pages/verifier/DocumentReview';

// Committee Pages
import CommitteeDashboard from './pages/committee/CommitteeDashboard';
import ApplicationReview from './pages/committee/ApplicationReview';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageScholarships from './pages/admin/ManageScholarships';
import ManageUsers from './pages/admin/ManageUsers';
import Reports from './pages/admin/Reports';
import AdminApplications from './pages/admin/AdminApplications';

function RoleRedirect() {
  const user = useAuthStore((s) => s.user);
  if (!user) return <Navigate to="/login" replace />;

  const paths: Record<string, string> = {
    STUDENT: '/student/dashboard',
    VERIFIER: '/verifier/dashboard',
    COMMITTEE: '/committee/dashboard',
    ADMIN: '/admin/dashboard',
    SUPER_ADMIN: '/admin/dashboard',
  };
  return <Navigate to={paths[user.role] || '/login'} replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Student Routes */}
        <Route element={<DashboardLayout />}>
          <Route path="/student/dashboard" element={<StudentDashboard />} />
          <Route path="/student/scholarships" element={<ScholarshipList />} />
          <Route path="/student/apply/:scholarshipId" element={<Apply />} />
          <Route path="/student/my-applications" element={<MyApplications />} />
        </Route>

        {/* Verifier Routes */}
        <Route element={<DashboardLayout />}>
          <Route path="/verifier/dashboard" element={<VerifierDashboard />} />
          <Route path="/verifier/documents" element={<DocumentReview />} />
        </Route>

        {/* Committee Routes */}
        <Route element={<DashboardLayout />}>
          <Route path="/committee/dashboard" element={<CommitteeDashboard />} />
          <Route path="/committee/review" element={<ApplicationReview />} />
        </Route>

        {/* Admin Routes */}
        <Route element={<DashboardLayout />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/scholarships" element={<ManageScholarships />} />
          <Route path="/admin/users" element={<ManageUsers />} />
          <Route path="/admin/reports" element={<Reports />} />
          <Route path="/admin/applications" element={<AdminApplications />} />
        </Route>

        {/* Root redirect */}
        <Route path="/" element={<RoleRedirect />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
