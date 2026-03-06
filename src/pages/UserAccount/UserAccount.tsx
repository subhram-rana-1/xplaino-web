import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { User, Settings, CreditCard, Sparkles } from 'lucide-react';
import styles from './UserAccount.module.css';
import { ProfileTab, SettingsTab, SubscriptionTab, CustomPromptTab } from './components';

type TabType = 'profile' | 'settings' | 'subscription' | 'custom-prompt';

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
    if (location.pathname === '/user/account/custom-prompt') return 'custom-prompt';
    return 'settings'; // default to settings
  };

  const activeTab = getActiveTab();

  const getHeading = () => {
    switch (activeTab) {
      case 'profile':
        return 'Profile';
      case 'subscription':
        return 'Subscription';
      case 'custom-prompt':
        return 'Custom Prompt';
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
              <User className={styles.tabIcon} size={20} />
              <span>Profile</span>
            </Link>
            <Link
              to="/user/account/settings"
              className={`${styles.tab} ${activeTab === 'settings' ? styles.tabActive : ''}`}
            >
              <Settings className={styles.tabIcon} size={20} />
              <span>Settings</span>
            </Link>
            <Link
              to="/user/account/subscription"
              className={`${styles.tab} ${activeTab === 'subscription' ? styles.tabActive : ''}`}
            >
              <CreditCard className={styles.tabIcon} size={20} />
              <span>Subscription</span>
            </Link>
            <Link
              to="/user/account/custom-prompt"
              className={`${styles.tab} ${activeTab === 'custom-prompt' ? styles.tabActive : ''}`}
            >
              <Sparkles className={styles.tabIcon} size={20} />
              <span>Custom Prompt</span>
            </Link>
          </div>

          {/* Content Area */}
          <div className={styles.contentArea}>
            {activeTab === 'profile' && <ProfileTab />}
            {activeTab === 'settings' && <SettingsTab />}
            {activeTab === 'subscription' && <SubscriptionTab />}
            {activeTab === 'custom-prompt' && <CustomPromptTab />}
          </div>
        </div>
      </div>
    </div>
  );
};

UserAccount.displayName = 'UserAccount';
