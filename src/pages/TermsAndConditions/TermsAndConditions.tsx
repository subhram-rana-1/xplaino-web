import React from 'react';
import styles from './TermsAndConditions.module.css';

/**
 * TermsAndConditions - Terms & Conditions page component
 * 
 * @returns JSX element
 */
export const TermsAndConditions: React.FC = () => {
  return (
    <div className={styles.termsAndConditions}>
      <h1>Terms & Conditions</h1>
      <p>Terms & Conditions content - Coming soon</p>
    </div>
  );
};

TermsAndConditions.displayName = 'TermsAndConditions';

