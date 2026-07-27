import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth, AppRole } from '@/hooks/useAuth';

interface Props {
  children: ReactNode;
  requireRole?: AppRole;
  requireVerifiedEmail?: boolean;
}

export function ProtectedRoute({ children, requireRole, requireVerifiedEmail }: Props) {
  const { session, roles, emailVerified, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-bg">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/?next=${next}`} replace />;
  }

  if (requireVerifiedEmail && !emailVerified) {
    return <Navigate to="/verify-email" replace />;
  }

  if (requireRole && !roles.includes(requireRole)) {
    return <Navigate to="/welcome" replace />;
  }

  return <>{children}</>;
}
