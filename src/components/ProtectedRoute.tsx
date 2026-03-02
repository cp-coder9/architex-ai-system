import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store';
import { UserRole } from '@/types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRole: UserRole;
}

export function ProtectedRoute({ children, allowedRole }: ProtectedRouteProps) {
  const { isAuthenticated, currentUser, tempOnboardingData } = useAuthStore();

  // Allow access to client dashboard if user has onboarding data (post-onboarding flow)
  if (!isAuthenticated && allowedRole === 'client' && tempOnboardingData) {
    return <>{children}</>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (currentUser?.role !== allowedRole) {
    // Redirect to appropriate dashboard based on role
    const userRole = currentUser?.role;
    if (!userRole || !['admin', 'client', 'freelancer'].includes(userRole)) {
      return <Navigate to="/login" replace />;
    }
    const redirectPath = userRole === 'admin' 
      ? '/admin' 
      : userRole === 'client' 
        ? '/client' 
        : '/freelancer';
    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
}
