import React from 'react';
import { usePageTitle } from '@/shared/hooks/usePageTitle';
import { FolderBookmark } from '../FolderBookmark';

export const FolderImagePage: React.FC = () => {
  usePageTitle('Images – Xplaino Dashboard');
  return <FolderBookmark activeTab="image" />;
};

FolderImagePage.displayName = 'FolderImagePage';
