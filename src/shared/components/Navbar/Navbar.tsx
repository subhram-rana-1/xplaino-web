import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import styles from './Navbar.module.css';
import logoImage from '../../../assets/images/logo-white-removebg.png';
import { DropdownIcon } from '@/shared/components/DropdownIcon';

/**
 * Navbar - Main navigation component with logo, brand name, and navigation links
 * 
 * @returns JSX element
 */
export const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
    setIsDropdownOpen(false);
  };

  const handleDropdownToggle = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

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
        
        <button 
          className={styles.menuToggle}
          onClick={toggleMenu}
          aria-label="Toggle menu"
          aria-expanded={isMenuOpen}
        >
          <span className={styles.hamburger}>
            <span className={styles.line}></span>
            <span className={styles.line}></span>
            <span className={styles.line}></span>
          </span>
        </button>
        
        <div className={styles.navCenter}>
          <div className={`${styles.navLinks} ${isMenuOpen ? styles.navLinksOpen : ''}`}>
            <div 
              className={styles.dropdownContainer}
              onMouseEnter={() => !isMenuOpen && setIsDropdownOpen(true)}
              onMouseLeave={() => !isMenuOpen && setIsDropdownOpen(false)}
            >
              <button
                className={`${styles.navLink} ${styles.dropdownTrigger}`}
                onClick={handleDropdownToggle}
                aria-haspopup="true"
                aria-expanded={isDropdownOpen}
              >
                My Learnings
                <DropdownIcon isOpen={isDropdownOpen} />
              </button>
              <div 
                className={`${styles.dropdownMenu} ${isDropdownOpen ? styles.dropdownMenuOpen : ''}`}
                role="menu"
              >
                <Link 
                  to="/my-words" 
                  className={styles.dropdownItem} 
                  onClick={closeMenu}
                  role="menuitem"
                >
                  My Words
                </Link>
                <Link 
                  to="/my-paragraphs" 
                  className={styles.dropdownItem} 
                  onClick={closeMenu}
                  role="menuitem"
                >
                  My Paragraphs
                </Link>
                <Link 
                  to="/my-pages" 
                  className={styles.dropdownItem} 
                  onClick={closeMenu}
                  role="menuitem"
                >
                  My Pages
                </Link>
              </div>
            </div>
            <Link to="/report-issue" className={styles.navLink} onClick={closeMenu}>
              Report Issue
            </Link>
          </div>
        </div>
        
        <div className={styles.navRight}>
          <Link to="/login" className={styles.loginButton} onClick={closeMenu}>
            Login
          </Link>
        </div>
      </div>
    </nav>
  );
};

Navbar.displayName = 'Navbar';

