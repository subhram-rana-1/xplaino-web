import React from 'react';
import styles from './MyPages.module.css';

/**
 * MyPages - My Pages page component
 * 
 * @returns JSX element
 */
export const MyPages: React.FC = () => {
  return (
    <div className={styles.myPages}>
      <div className={styles.content}>
        <h1 className={styles.heading}>My Pages</h1>
        <p className={styles.message}>Your saved pages will appear here.</p>
      </div>
    </div>
  );
};

MyPages.displayName = 'MyPages';

