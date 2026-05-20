import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { useAuthStore } from './store/authStore';
import ProtectedRoute from './router/ProtectedRoute';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import UserDashboard from './pages/dashboard/UserDashboard';
import ManagerDashboard from './pages/dashboard/ManagerDashboard';
import AdminDashboard from './pages/dashboard/AdminDashboard';
import RequestDetail from './pages/RequestDetail';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

function RoleRedirect() {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'manager') return <Navigate to="/manager" replace />;
  if (user.role === 'admin') return <Navigate to="/admin" replace />;
  return <Navigate to="/dashboard" replace />;
}

export default function App() {
  const { initFromStorage, logout } = useAuthStore();

  useEffect(() => {
    initFromStorage();
    // Global 401 handler from Axios interceptor
    const handler = () => {
      logout();
    };
    window.addEventListener('auth:logout', handler);
    return () => window.removeEventListener('auth:logout', handler);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          {/* Authenticated routes with sidebar layout */}
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<RoleRedirect />} />

              {/* User routes */}
              <Route element={<ProtectedRoute allowedRoles={['user']} />}>
                <Route path="/dashboard" element={<UserDashboard />} />
              </Route>

              {/* Manager routes */}
              <Route element={<ProtectedRoute allowedRoles={['manager']} />}>
                <Route path="/manager" element={<ManagerDashboard />} />
              </Route>

              {/* Admin routes */}
              <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                <Route path="/admin" element={<AdminDashboard />} />
              </Route>

              {/* Shared: Request detail accessible to all roles */}
              <Route path="/requests/:id" element={<RequestDetail />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" richColors closeButton />
    </QueryClientProvider>
  );
}
