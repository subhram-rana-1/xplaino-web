import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { FiUser, FiSettings } from 'react-icons/fi';
import styles from './UserAccount.module.css';
import { ProfileTab, SettingsTab } from './components';

type TabType = 'profile' | 'settings';

/**
 * UserAccount - User account page with sidebar and tabs
 * 
 * @returns JSX element
 */
export const UserAccount: React.FC = () => {
  const location = useLocation();

  // Determine active tab from current route
  const getActiveTab = (): TabType => {
    if (location.pathname === '/user/account/profile') return 'profile';
    return 'settings'; // default to settings
  };

  const activeTab = getActiveTab();

  const getHeading = () => {
    return activeTab === 'profile' ? 'Profile' : 'Settings';
  };

  return (
    <div className={styles.account}>
      <div className={styles.container}>
        <div className={styles.titleContainer}>
          <h1 className={styles.heading}>{getHeading()}</h1>
        </div>

        <div className={styles.layout}>
          {/* Sidebar */}
          <div className={styles.sidebar}>
            <Link
              to="/user/account/profile"
              className={`${styles.tab} ${activeTab === 'profile' ? styles.tabActive : ''}`}
            >
              <FiUser className={styles.tabIcon} size={20} />
              <span>Profile</span>
            </Link>
            <Link
              to="/user/account/settings"
              className={`${styles.tab} ${activeTab === 'settings' ? styles.tabActive : ''}`}
            >
              <FiSettings className={styles.tabIcon} size={20} />
              <span>Settings</span>
            </Link>
          </div>

          {/* Content Area */}
          <div className={styles.contentArea}>
            {activeTab === 'profile' && <ProfileTab />}
            {activeTab === 'settings' && <SettingsTab />}
          </div>
        </div>
      </div>
    </div>
  );
};

UserAccount.displayName = 'UserAccount';
