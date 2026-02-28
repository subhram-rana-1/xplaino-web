import React, { useMemo, useState, useEffect } from 'react';
import { useLocation, Link, Outlet } from 'react-router-dom';
import { FiBookmark, FiBookOpen, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import styles from './UserDashboardLayout.module.css';

const SIDEBAR_VISIBLE_KEY = 'xplaino-dashboard-sidebar-visible';

function getStoredSidebarVisible(): boolean {
  try {
    const stored = localStorage.getItem(SIDEBAR_VISIBLE_KEY);
    return stored === null ? true : stored === 'true';
  } catch {
    return true;
  }
}

type UserDashboardSection = 'bookmarks' | 'pdf';

/**
 * UserDashboardLayout - User dashboard layout component with sidebar navigation
 * Uses Outlet to render nested routes, keeping the layout mounted during route changes
 * 
 * @returns JSX element
 */
export const UserDashboardLayout: React.FC = () => {
  const location = useLocation();
  const [sidebarVisible, setSidebarVisible] = useState(getStoredSidebarVisible);

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_VISIBLE_KEY, String(sidebarVisible));
    } catch {
      // ignore
    }
  }, [sidebarVisible]);

  const sidebarItems: {
    key: UserDashboardSection;
    label: string;
    path: string;
    icon: React.ReactNode;
    hidden?: boolean;
  }[] = useMemo(
    () => [
      { key: 'bookmarks', label: 'Bookmarks', path: '/user/dashboard/bookmark', icon: <FiBookmark /> },
      { key: 'pdf', label: 'Pdf', path: '/user/dashboard/pdf', icon: <FiBookOpen /> },
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
      <div className={`${styles.sidebar} ${!sidebarVisible ? styles.sidebarHidden : ''}`}>
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
      </div>
      <button
        type="button"
        className={`${styles.sidebarToggle} ${!sidebarVisible ? styles.sidebarToggleCollapsed : ''}`}
        onClick={() => setSidebarVisible((v) => !v)}
        title={sidebarVisible ? 'Hide sidebar' : 'Show sidebar'}
        aria-label={sidebarVisible ? 'Hide sidebar' : 'Show sidebar'}
      >
        {sidebarVisible ? <FiChevronLeft size={14} /> : <FiChevronRight size={14} />}
      </button>
      <div className={styles.content}>
        <Outlet />
      </div>
    </div>
  );
};

UserDashboardLayout.displayName = 'UserDashboardLayout';

