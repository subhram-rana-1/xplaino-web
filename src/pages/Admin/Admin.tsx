import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styles from './Admin.module.css';
import { useAuth } from '@/shared/hooks/useAuth';
import { AdminPricing } from './components/AdminPricing';
import { Toast } from '@/shared/components/Toast';

type AdminSection = 'user' | 'pricing' | 'ticket' | 'subscription';

interface LocationState {
  activeSection?: AdminSection;
  toast?: { message: string; type?: 'success' | 'error' };
}

/**
 * Admin - Admin page component with sidebar navigation
 * 
 * @returns JSX element
 */
export const Admin: React.FC = () => {
  const { isLoggedIn, user, accessToken } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as LocationState | null;
  
  const [activeSection, setActiveSection] = useState<AdminSection>(
    locationState?.activeSection || 'pricing'
  );
  const [toast, setToast] = useState<{ message: string; type?: 'success' | 'error' } | null>(
    locationState?.toast || null
  );

  // Clear location state after reading it
  useEffect(() => {
    if (locationState) {
      window.history.replaceState({}, document.title);
    }
  }, [locationState]);

  // Check if user is admin and redirect if not
  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }

    if (user?.role !== 'ADMIN' && user?.role !== 'SUPER_ADMIN') {
      navigate('/');
    }
  }, [isLoggedIn, user, navigate]);

  if (!isLoggedIn || (user?.role !== 'ADMIN' && user?.role !== 'SUPER_ADMIN')) {
    return null;
  }

  const sidebarItems: { key: AdminSection; label: string }[] = [
    { key: 'user', label: 'User' },
    { key: 'pricing', label: 'Pricing' },
    { key: 'ticket', label: 'Ticket' },
    { key: 'subscription', label: 'Subscription' },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'pricing':
        return <AdminPricing accessToken={accessToken} />;
      case 'user':
      case 'ticket':
      case 'subscription':
        return (
          <div className={styles.comingSoon}>
            <h2>Coming Soon</h2>
            <p>This section is under development.</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className={styles.admin}>
      <div className={styles.sidebar}>
        <h2 className={styles.sidebarTitle}>Admin panel</h2>
        <nav className={styles.sidebarNav}>
          {sidebarItems.map((item) => (
            <button
              key={item.key}
              className={`${styles.sidebarButton} ${activeSection === item.key ? styles.sidebarButtonActive : ''}`}
              onClick={() => setActiveSection(item.key)}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </div>
      <div className={styles.content}>
        {renderContent()}
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

Admin.displayName = 'Admin';

