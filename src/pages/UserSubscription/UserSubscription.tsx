import React from 'react';
import styles from './UserSubscription.module.css';

/**
 * UserSubscription - User subscription page
 * 
 * @returns JSX element
 */
export const UserSubscription: React.FC = () => {
  return (
    <div className={styles.subscription}>
      <div className={styles.container}>
        <h1 className={styles.title}>Subscription</h1>
        <p className={styles.subtitle}>This page is under development.</p>
      </div>
    </div>
  );
};

UserSubscription.displayName = 'UserSubscription';

