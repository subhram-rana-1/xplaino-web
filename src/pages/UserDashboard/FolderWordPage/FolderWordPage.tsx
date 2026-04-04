import React from 'react';
import { usePageTitle } from '@/shared/hooks/usePageTitle';
import { FolderBookmark } from '../FolderBookmark';

export const FolderWordPage: React.FC = () => {
  usePageTitle('Word Documents – Xplaino Dashboard');
  return <FolderBookmark activeTab="word" />;
};

FolderWordPage.displayName = 'FolderWordPage';
