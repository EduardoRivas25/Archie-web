import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import type { RoleType } from '@/services/roleService';

interface ProtectedRouteProps {
  children: React.ReactNode;
  roles?: RoleType[];
}

export function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, profile } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-sm font-medium">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check role permissions
  if (roles && roles.length > 0 && profile) {
    if (!roles.includes(profile.role)) {
      return <Navigate to="/chat" replace />;
    }
  }

  return <>{children}</>;
}
