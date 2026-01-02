import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/shared/hooks/useAuth';
import styles from './AdminDashboard.module.css';

/**
 * AdminDashboard - Admin dashboard page
 * Redirects to /admin if user is admin, otherwise shows placeholder
 * 
 * @returns JSX element
 */
export const AdminDashboard: React.FC = () => {
  const { isLoggedIn, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoggedIn && (user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN')) {
      // Redirect to main admin page
      navigate('/admin', { replace: true });
    } else if (!isLoggedIn) {
      navigate('/login', { replace: true });
    } else {
      navigate('/', { replace: true });
    }
  }, [isLoggedIn, user, navigate]);

  return (
    <div className={styles.dashboard}>
      <div className={styles.container}>
        <h1 className={styles.title}>Admin Dashboard</h1>
        <p className={styles.subtitle}>Redirecting...</p>
      </div>
    </div>
  );
};

AdminDashboard.displayName = 'AdminDashboard';

