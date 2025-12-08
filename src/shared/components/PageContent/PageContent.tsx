import React from 'react';
import styles from './PageContent.module.css';

interface PageContentProps {
  children: React.ReactNode;
}

/**
 * PageContent - Wrapper component for page content with padding
 * 
 * @param props - Component props
 * @returns JSX element
 */
export const PageContent: React.FC<PageContentProps> = ({ children }) => {
  return (
    <main className={styles.pageContent}>
      {children}
    </main>
  );
};

PageContent.displayName = 'PageContent';



