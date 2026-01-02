import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/shared/hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactElement;
}

/**
 * ProtectedRoute - Wrapper component that protects routes requiring authentication
 * Redirects unauthenticated users to home page with login modal state
 * 
 * @param props - Component props
 * @returns JSX element
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isLoggedIn, isLoading } = useAuth();
  const location = useLocation();

  // Wait for auth state to load before making redirect decisions
  if (isLoading) {
    return null; // or a loading spinner if preferred
  }

  if (!isLoggedIn) {
    // Redirect to home page with state to show login modal
    return <Navigate to="/" state={{ showLoginModal: true, from: location.pathname }} replace />;
  }

  return children;
};

ProtectedRoute.displayName = 'ProtectedRoute';

