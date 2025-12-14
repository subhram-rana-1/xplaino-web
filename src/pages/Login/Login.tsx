import React from 'react';
import styles from './Login.module.css';

/**
 * Login - Login page component
 * 
 * @returns JSX element
 */
export const Login: React.FC = () => {
  return (
    <div className={styles.login}>
      <div className={styles.content}>
        <h1 className={styles.heading}>Login</h1>
        <p className={styles.message}>Login functionality will be implemented here.</p>
      </div>
    </div>
  );
};

Login.displayName = 'Login';

