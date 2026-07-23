import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface ProtectedRouteProps {
  allowedRoles: string[];
}

function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center font-sans text-slate-500">Loading...</div>;
  }

  if (!user) return <Navigate to="/login" replace />;
  
  // Case-insensitive role check
  const hasRole = allowedRoles.some(role => role.toUpperCase() === user.role.toUpperCase());
  if (!hasRole) return <Navigate to="/unauthorized" replace />;

  return <Outlet />;
}

export default ProtectedRoute;
