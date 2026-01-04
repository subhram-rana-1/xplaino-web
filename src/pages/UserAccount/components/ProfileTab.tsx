import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiLogOut } from 'react-icons/fi';
import styles from './ProfileTab.module.css';
import { useAuth } from '@/shared/hooks/useAuth';
import { Toast } from '@/shared/components/Toast';

/**
 * ProfileTab - Profile information and logout functionality
 * 
 * @returns JSX element
 */
export const ProfileTab: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  if (!user) {
    return null;
  }

  const displayName = user.firstName && user.lastName
    ? `${user.firstName} ${user.lastName}`
    : user.name || 'User';

  const initials = (user.firstName?.[0] || user.name?.[0] || 'U').toUpperCase();

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
      setToast({ message: 'Logged out successfully', type: 'success' });
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
      setToast({ message: 'Failed to logout', type: 'error' });
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className={styles.profileTab}>
      <div className={styles.content}>
        <div className={styles.profileInfoRow}>
          <div className={styles.profileIconContainer}>
            {user.picture ? (
              <img 
                src={user.picture} 
                alt={displayName} 
                className={styles.profileIcon}
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className={styles.profileIconPlaceholder}>
                {initials}
              </div>
            )}
          </div>
          <div className={styles.infoSection}>
            <div className={styles.infoRow}>
              <span className={styles.fieldName}>Name:</span>
              <span className={styles.fieldValue}>{displayName}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.fieldName}>Email:</span>
              <span className={styles.fieldValue}>{user.email}</span>
            </div>
          </div>
        </div>

        <button 
          className={styles.logoutButton}
          onClick={handleLogout}
          disabled={isLoggingOut}
        >
          <FiLogOut className={styles.logoutIcon} size={18} />
          {isLoggingOut ? 'Logging out...' : 'Logout'}
        </button>
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

ProfileTab.displayName = 'ProfileTab';

