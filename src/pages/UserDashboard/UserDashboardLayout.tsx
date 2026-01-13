import React, { useMemo } from 'react';
import { useLocation, Link, Outlet } from 'react-router-dom';
import styles from './UserDashboardLayout.module.css';

type UserDashboardSection = 'bookmarks' | 'pdf';

/**
 * UserDashboardLayout - User dashboard layout component with sidebar navigation
 * Uses Outlet to render nested routes, keeping the layout mounted during route changes
 * 
 * @returns JSX element
 */
export const UserDashboardLayout: React.FC = () => {
  const location = useLocation();

  const sidebarItems: { key: UserDashboardSection; label: string; path: string }[] = useMemo(() => [
    { key: 'bookmarks', label: 'My Bookmarks', path: '/user/dashboard/bookmark' },
    { key: 'pdf', label: 'Pdf', path: '/user/dashboard/pdf' },
  ], []);

  // Determine active section from current route
  const activeSection = useMemo((): UserDashboardSection => {
    const path = location.pathname;
    if (path.startsWith('/user/dashboard/pdf')) return 'pdf';
    if (path.startsWith('/user/dashboard/bookmark')) return 'bookmarks';
    if (path.startsWith('/user/dashboard')) return 'bookmarks'; // fallback for /user/dashboard
    return 'bookmarks'; // default
  }, [location.pathname]);

  return (
    <div className={styles.userDashboard}>
      <div className={styles.sidebar}>
        <h2 className={styles.sidebarTitle}>My dashboard</h2>
        <nav className={styles.sidebarNav}>
          {sidebarItems.map((item) => (
            <Link
              key={item.key}
              to={item.path}
              className={`${styles.sidebarButton} ${activeSection === item.key ? styles.sidebarButtonActive : ''}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className={styles.content}>
        <Outlet />
      </div>
    </div>
  );
};

UserDashboardLayout.displayName = 'UserDashboardLayout';

