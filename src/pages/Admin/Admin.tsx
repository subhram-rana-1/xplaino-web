import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import styles from './Admin.module.css';

interface AdminLayoutProps {
  children: React.ReactNode;
}

type AdminSection = 'all-users' | 'pricing' | 'ticket' | 'subscription' | 'domain';

/**
 * Admin - Admin layout component with sidebar navigation
 * 
 * @returns JSX element
 */
export const Admin: React.FC<AdminLayoutProps> = ({ children }) => {
  const location = useLocation();

  const sidebarItems: { key: AdminSection; label: string; path: string }[] = [
    { key: 'all-users', label: 'All users', path: '/admin/all-users' },
    { key: 'pricing', label: 'Pricing', path: '/admin/pricing' },
    { key: 'ticket', label: 'Ticket', path: '/admin/ticket' },
    { key: 'subscription', label: 'Subscription', path: '/admin/subscription' },
    { key: 'domain', label: 'Domain', path: '/admin/domain' },
  ];

  // Determine active section from current route
  const getActiveSection = (): AdminSection => {
    const path = location.pathname;
    if (path.startsWith('/admin/all-users')) return 'all-users';
    if (path.startsWith('/admin/pricing')) return 'pricing';
    if (path.startsWith('/admin/ticket')) return 'ticket';
    if (path.startsWith('/admin/subscription')) return 'subscription';
    if (path.startsWith('/admin/domain')) return 'domain';
    return 'pricing'; // default
  };

  const activeSection = getActiveSection();

  return (
    <div className={styles.admin}>
      <div className={styles.sidebar}>
        <h2 className={styles.sidebarTitle}>Admin panel</h2>
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
        {children}
      </div>
    </div>
  );
};

Admin.displayName = 'Admin';

