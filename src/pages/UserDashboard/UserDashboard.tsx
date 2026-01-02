import React from 'react';
import styles from './UserDashboard.module.css';

/**
 * UserDashboard - Placeholder page for user dashboard
 * 
 * @returns JSX element
 */
export const UserDashboard: React.FC = () => {
  return (
    <div className={styles.dashboard}>
      <div className={styles.container}>
        <h1 className={styles.title}>User Dashboard</h1>
        <p className={styles.subtitle}>This page is under development.</p>
      </div>
    </div>
  );
};

UserDashboard.displayName = 'UserDashboard';

