import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { FiUser, FiSettings, FiCreditCard } from 'react-icons/fi';
import styles from './UserAccount.module.css';
import { ProfileTab, SettingsTab, SubscriptionTab } from './components';

type TabType = 'profile' | 'settings' | 'subscription';

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
    if (location.pathname === '/user/account/subscription') return 'subscription';
    return 'settings'; // default to settings
  };

  const activeTab = getActiveTab();

  const getHeading = () => {
    switch (activeTab) {
      case 'profile':
        return 'Profile';
      case 'subscription':
        return 'Subscription';
      default:
        return 'Settings';
    }
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
            <Link
              to="/user/account/subscription"
              className={`${styles.tab} ${activeTab === 'subscription' ? styles.tabActive : ''}`}
            >
              <FiCreditCard className={styles.tabIcon} size={20} />
              <span>Subscription</span>
            </Link>
          </div>

          {/* Content Area */}
          <div className={styles.contentArea}>
            {activeTab === 'profile' && <ProfileTab />}
            {activeTab === 'settings' && <SettingsTab />}
            {activeTab === 'subscription' && <SubscriptionTab />}
          </div>
        </div>
      </div>
    </div>
  );
};

UserAccount.displayName = 'UserAccount';
