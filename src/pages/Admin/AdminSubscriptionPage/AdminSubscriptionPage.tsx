import React from 'react';
import { Admin } from '../Admin';
import styles from './AdminSubscriptionPage.module.css';

/**
 * AdminSubscriptionPage - Admin subscription management page
 * 
 * @returns JSX element
 */
export const AdminSubscriptionPage: React.FC = () => {
  return (
    <Admin>
      <div className={styles.comingSoon}>
        <h2>Coming Soon</h2>
        <p>This section is under development.</p>
      </div>
    </Admin>
  );
};

AdminSubscriptionPage.displayName = 'AdminSubscriptionPage';

