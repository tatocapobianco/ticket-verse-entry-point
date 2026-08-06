import { Navigate, Outlet } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { AdminAuthProvider, useAdminAuth } from '@/hooks/useAdminAuth';
import AdminLogin from '@/pages/admin/AdminLogin';
import NotFound from '@/pages/NotFound';

function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted">
      <Loader2 className="h-5 w-5 animate-spin text-primary" />
    </div>
  );
}

/** Provider único para todo /admin. */
export function AdminAuthShell() {
  return (
    <AdminAuthProvider>
      <Outlet />
    </AdminAuthProvider>
  );
}

/** Pantalla de acceso: si ya hay sesión de admin válida, entra al panel. */
export function AdminEntry() {
  const { session, isAdmin, loading } = useAdminAuth();
  if (loading) return <Loading />;
  if (session && isAdmin) return <Navigate to="/admin/metricas" replace />;
  return <AdminLogin />;
}

/** Quien no es super_admin ve un 404: el panel no debe ser descubrible. */
export default function AdminGate() {
  const { session, isAdmin, loading } = useAdminAuth();
  if (loading) return <Loading />;
  if (!session) return <Navigate to="/admin" replace />;
  if (!isAdmin) return <NotFound />;
  return <Outlet />;
}
