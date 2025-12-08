import React from 'react';
import styles from './Home.module.css';

/**
 * Home - Home page component
 * 
 * @returns JSX element
 */
export const Home: React.FC = () => {
  return (
    <div className={styles.home}>
      <h1>Welcome to Xplaino</h1>
      <p>Your platform for explanations and discussions.</p>
    </div>
  );
};

Home.displayName = 'Home';
