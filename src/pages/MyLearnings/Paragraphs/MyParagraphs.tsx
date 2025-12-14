import React from 'react';
import styles from './MyParagraphs.module.css';

/**
 * MyParagraphs - My Paragraphs page component
 * 
 * @returns JSX element
 */
export const MyParagraphs: React.FC = () => {
  return (
    <div className={styles.myParagraphs}>
      <div className={styles.content}>
        <h1 className={styles.heading}>My Paragraphs</h1>
        <p className={styles.message}>Your saved paragraphs will appear here.</p>
      </div>
    </div>
  );
};

MyParagraphs.displayName = 'MyParagraphs';

