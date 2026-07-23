import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import AdminLayout from '@/layouts/AdminLayout';
import Dashboard from '@/pages/admin/Dashboard';
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
