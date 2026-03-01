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
  const isPdfDetailPage = location.pathname.startsWith('/pdf/');
  const isToolsPdfPage = location.pathname === '/tools/pdf';
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isUserAccountRoute = location.pathname.startsWith('/user/account');
  const isUserDashboardRoute = location.pathname.startsWith('/user/dashboard');
  
  const getPageContentClass = () => {
    if (isHomePage) {
      return styles.pageContentFullWidthNoBottomPadding;
    }
    if (isPdfDetailPage) {
      return styles.pageContentPdfDetail;
    }
    if (isToolsPdfPage) {
      return styles.pageContentFullWidth;
    }
    return styles.pageContent;
  };

  return (
    <main 
      key={location.pathname}
      className={`${getPageContentClass()} ${!isAdminRoute && !isUserAccountRoute && !isUserDashboardRoute && !isPdfDetailPage ? styles.fadeIn : ''}`}
    >
      {children}
    </main>
  );
};

PageContent.displayName = 'PageContent';



