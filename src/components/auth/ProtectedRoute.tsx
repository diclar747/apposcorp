import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores';
import type { UserRole } from '@/types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  allowedRoles 
}) => {
  const { isAuthenticated, activeRole, isHydrated } = useAuthStore();
  const location = useLocation();

  if (!isHydrated) {
    return null; // Or a loading spinner
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && activeRole && !allowedRoles.includes(activeRole)) {
    // Redirect to their default dashboard if they don't have access to this one
    const targetPath = activeRole === 'superadmin' ? '/admin' : 
                      activeRole === 'seller' ? '/vendedor' : 
                      activeRole === 'client' ? '/app' : '/';
    
    return <Navigate to={targetPath} replace />;
  }

  return <>{children}</>;
};
