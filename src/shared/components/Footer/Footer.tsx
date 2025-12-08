import React from 'react';
import { Link } from 'react-router-dom';
import styles from './Footer.module.css';

/**
 * Footer - Footer component
 * 
 * @returns JSX element
 */
export const Footer: React.FC = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.links}>
          <Link to="/terms-and-conditions" className={styles.link}>
            Terms & Conditions
          </Link>
          <Link to="/privacy-policy" className={styles.link}>
            Privacy Policy
          </Link>
        </div>
        <p className={styles.copyright}>
          © {new Date().getFullYear()} Xplaino. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

Footer.displayName = 'Footer';



