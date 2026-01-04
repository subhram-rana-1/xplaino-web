import React from 'react';
import { useLocation } from 'react-router-dom';
import styles from './PageContent.module.css';

interface PageContentProps {
  children: React.ReactNode;
}

/**
 * PageContent - Wrapper component for page content with conditional styling based on route
 * 
 * @param props - Component props
 * @returns JSX element
 */
export const PageContent: React.FC<PageContentProps> = ({ children }) => {
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isUserAccountRoute = location.pathname.startsWith('/user/account');
  
  return (
    <main 
      key={location.pathname}
      className={`${isHomePage ? styles.pageContentFullWidth : styles.pageContent} ${!isAdminRoute && !isUserAccountRoute ? styles.fadeIn : ''}`}
    >
      {children}
    </main>
  );
};

PageContent.displayName = 'PageContent';



