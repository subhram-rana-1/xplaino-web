import React from 'react';
import { Link } from 'react-router-dom';
import styles from './Navbar.module.css';
import logoImage from '../../../assets/images/logo-white-removebg.png';

/**
 * Navbar - Main navigation component with logo, brand name, and navigation links
 * 
 * @returns JSX element
 */
export const Navbar: React.FC = () => {
  return (
    <nav className={styles.navbar}>
      <div className={styles.container}>
        <Link to="/" className={styles.brand}>
          <img 
            src={logoImage} 
            alt="Xplaino Logo" 
            className={styles.logo}
          />
          <span className={styles.brandName}>Xplaino</span>
        </Link>
        
        <div className={styles.navLinks}>
          <Link to="/contact" className={styles.navLink}>
            Contact
          </Link>
          <Link to="/forum" className={styles.navLink}>
            Forum
          </Link>
        </div>
      </div>
    </nav>
  );
};

Navbar.displayName = 'Navbar';

