import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getDefaultRouteForRole } from '../pages/WireframeShell';

interface RoleGuardProps {
  /** Roles that are allowed to access this route */
  allowed: string[];
  children: React.ReactNode;
}

/**
 * Wraps a route element and redirects users whose role is not in `allowed`
 * back to their default dashboard.
 */
export default function RoleGuard({ allowed, children }: RoleGuardProps) {
  const { user } = useAuth();
  if (!user || !allowed.includes(user.role)) {
    const fallback = user ? getDefaultRouteForRole(user.role) : '/login';
    return <Navigate to={fallback} replace />;
  }
  return <>{children}</>;
}
