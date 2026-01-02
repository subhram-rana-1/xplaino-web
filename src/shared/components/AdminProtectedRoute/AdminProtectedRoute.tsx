import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/shared/hooks/useAuth';

interface AdminProtectedRouteProps {
  children: React.ReactElement;
}

/**
 * AdminProtectedRoute - Wrapper component that protects routes requiring admin authentication
 * Redirects unauthenticated users to home page with login modal state
 * Redirects non-admin users to home page
 * 
 * @param props - Component props
 * @returns JSX element
 */
export const AdminProtectedRoute: React.FC<AdminProtectedRouteProps> = ({ children }) => {
  const { isLoggedIn, user, isLoading } = useAuth();
  const location = useLocation();

  // Wait for auth state to load before making redirect decisions
  if (isLoading) {
    return null; // or a loading spinner if preferred
  }

  // If not logged in, redirect to home with login modal
  if (!isLoggedIn) {
    return <Navigate to="/" state={{ showLoginModal: true, from: location.pathname }} replace />;
  }

  // If logged in but not admin, redirect to home (no modal)
  if (user?.role !== 'ADMIN' && user?.role !== 'SUPER_ADMIN') {
    return <Navigate to="/" replace />;
  }

  // User is logged in and is admin, allow access
  return children;
};

AdminProtectedRoute.displayName = 'AdminProtectedRoute';

