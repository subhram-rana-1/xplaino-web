import React from 'react';
import { usePageTitle } from '@/shared/hooks/usePageTitle';
import { FolderPdf } from './FolderPdf';

/**
 * FolderPdfPage - PDF folder detail page
 * Rendered inside UserDashboardLayout via Outlet
 */
export const FolderPdfPage: React.FC = () => {
  usePageTitle('PDF Library – Xplaino Dashboard');
  return <FolderPdf />;
};

FolderPdfPage.displayName = 'FolderPdfPage';
