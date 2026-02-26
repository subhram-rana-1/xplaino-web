import React, { useMemo } from 'react';
import { useLocation, Link, Outlet } from 'react-router-dom';
import { FiBookmark, FiBookOpen } from 'react-icons/fi';
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

  const sidebarItems: {
    key: UserDashboardSection;
    label: string;
    path: string;
    icon: React.ReactNode;
    hidden?: boolean;
  }[] = useMemo(
    () => [
      { key: 'bookmarks', label: 'Bookmarks', path: '/user/dashboard/bookmark', icon: <FiBookmark /> },
      // Pdf section is kept but marked as hidden so it doesn't show in the sidebar for now
      { key: 'pdf', label: 'Pdf', path: '/user/dashboard/pdf', icon: <FiBookOpen />, hidden: true },
    ],
    []
  );

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
          {sidebarItems
            .filter((item) => !item.hidden)
            .map((item) => (
              <Link
                key={item.key}
                to={item.path}
                className={`${styles.sidebarButton} ${activeSection === item.key ? styles.sidebarButtonActive : ''}`}
              >
                <span className={styles.sidebarButtonIcon}>{item.icon}</span>
                {item.label}
              </Link>
            ))}
        </nav>
        <div className={styles.comingSoonTeaser} aria-label="Upcoming features">
          <span className={styles.comingSoonBadge}>Coming Soon !</span>
          <span className={styles.comingSoonText}>
            Summarise any PDF & chat with your documents — Few days to launch.
          </span>
        </div>
      </div>
      <div className={styles.content}>
        <Outlet />
      </div>
    </div>
  );
};

UserDashboardLayout.displayName = 'UserDashboardLayout';

