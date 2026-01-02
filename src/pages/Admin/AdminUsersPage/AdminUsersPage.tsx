import React from 'react';
import { Admin } from '../Admin';
import styles from './AdminUsersPage.module.css';

/**
 * AdminUsersPage - Admin users management page
 * 
 * @returns JSX element
 */
export const AdminUsersPage: React.FC = () => {
  return (
    <Admin>
      <div className={styles.comingSoon}>
        <h2>Coming Soon</h2>
        <p>This section is under development.</p>
      </div>
    </Admin>
  );
};

AdminUsersPage.displayName = 'AdminUsersPage';

