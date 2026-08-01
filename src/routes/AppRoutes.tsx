import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import AdminLayout from '@/layouts/AdminLayout';
import Dashboard from '@/pages/admin/Dashboard';
import UsersRoles from '@/pages/admin/UsersRoles';
import AddUser from '@/pages/admin/AddUser';
import CoursesCalendars from '@/pages/admin/CoursesCalendars';
import Admissions from '@/pages/admin/Admissions';
import FeeManagement from '@/pages/admin/FeeManagement';
import Exams from '@/pages/admin/Exams';
import Results from '@/pages/admin/Results';
import Materials from '@/pages/admin/Materials';
import CareerTasks from '@/pages/admin/CareerTasks';
import Reviews from '@/pages/admin/Reviews';
import PointsLevels from '@/pages/admin/PointsLevels';
import Reports from '@/pages/admin/Reports';
import { Login } from '@/pages/auth/Login';
import { useAuth } from '@/hooks/useAuth';

const RoleBasedRedirect = () => {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex min-h-screen items-center justify-center font-sans text-slate-500">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role.toUpperCase() === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
  return <Navigate to="/login" replace />;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/unauthorized" element={<div>Unauthorized Access</div>} />

      {/* Protected Admin Routes */}
      <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin/dashboard" element={<Dashboard />} />
          <Route path="/admin/users-roles" element={<UsersRoles />} />
          <Route path="/admin/users-roles/new" element={<AddUser />} />
          <Route path="/admin/courses-calendars" element={<CoursesCalendars />} />
          <Route path="/admin/admissions" element={<Admissions />} />
          <Route path="/admin/fee-management" element={<FeeManagement />} />
          <Route path="/admin/exams" element={<Exams />} />
          <Route path="/admin/results" element={<Results />} />
          <Route path="/admin/materials" element={<Materials />} />
          <Route path="/admin/task-creator" element={<CareerTasks />} />
          <Route path="/admin/reviewer-workflow" element={<Reviews />} />
          <Route path="/admin/points-levels" element={<PointsLevels />} />
          <Route path="/admin/reports" element={<Reports />} />
        </Route>
      </Route>

      {/* Root Path Redirect */}
      <Route path="/" element={<RoleBasedRedirect />} />

      {/* Fallback Route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default AppRoutes;
