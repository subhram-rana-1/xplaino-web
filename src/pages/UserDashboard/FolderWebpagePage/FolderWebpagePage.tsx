import React from 'react';
import { usePageTitle } from '@/shared/hooks/usePageTitle';
import { FolderBookmark } from '../FolderBookmark';

export const FolderWebpagePage: React.FC = () => {
  usePageTitle('Saved Webpages – Xplaino Dashboard');
  return <FolderBookmark activeTab="link" />;
};

FolderWebpagePage.displayName = 'FolderWebpagePage';
