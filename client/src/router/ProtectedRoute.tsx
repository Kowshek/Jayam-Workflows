import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import type { Role } from '../types';

interface ProtectedRouteProps {
  allowedRoles?: Role[];
}

export default function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // Redirect to their proper dashboard
    if (user.role === 'user') return <Navigate to="/dashboard" replace />;
    if (user.role === 'manager') return <Navigate to="/manager" replace />;
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
  }

  return <Outlet />;
}
