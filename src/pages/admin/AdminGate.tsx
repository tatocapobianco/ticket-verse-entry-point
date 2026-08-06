import { Navigate, Outlet } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { AdminAuthProvider, useAdminAuth } from '@/hooks/useAdminAuth';
import NotFound from '@/pages/NotFound';

/** Quien no es super_admin ve un 404: el panel no debe ser descubrible. */
function Gate() {
  const { session, isAdmin, loading } = useAdminAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) return <Navigate to="/admin" replace />;
  if (!isAdmin) return <NotFound />;

  return <Outlet />;
}

export default function AdminGate() {
  return (
    <AdminAuthProvider>
      <Gate />
    </AdminAuthProvider>
  );
}

export function AdminAuthShell() {
  return (
    <AdminAuthProvider>
      <Outlet />
    </AdminAuthProvider>
  );
}
