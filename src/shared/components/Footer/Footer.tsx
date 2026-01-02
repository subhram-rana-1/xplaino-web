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
          <Link to="/privacy-policy" className={styles.link}>
            Privacy Policy
          </Link>
          <Link to="/terms-and-conditions" className={styles.link}>
            Terms & Conditions
          </Link>
          <Link to="/refund-policy" className={styles.link}>
            Refund Policy
          </Link>
          <Link to="/contact-us" className={styles.link}>
            Contact Us
          </Link>
        </div>
        <p className={styles.copyright}>
          Copyright © {new Date().getFullYear()}
        </p>
      </div>
    </footer>
  );
};

Footer.displayName = 'Footer';



