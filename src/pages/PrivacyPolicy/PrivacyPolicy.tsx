import React from 'react';
import styles from './PrivacyPolicy.module.css';

/**
 * PrivacyPolicy - Privacy Policy page component
 * 
 * @returns JSX element
 */
export const PrivacyPolicy: React.FC = () => {
  return (
    <div className={styles.privacyPolicy}>
      <h1>Privacy Policy</h1>
      <p>Privacy Policy content - Coming soon</p>
    </div>
  );
};

PrivacyPolicy.displayName = 'PrivacyPolicy';

