import React from 'react';
import { Admin } from '../Admin';
import { AdminUserFeedback } from '../components/AdminUserFeedback';
import { useAuth } from '@/shared/hooks/useAuth';
import { usePageTitle } from '@/shared/hooks/usePageTitle';

/**
 * AdminUserFeedbackPage - Admin user feedback management page
 *
 * @returns JSX element
 */
export const AdminUserFeedbackPage: React.FC = () => {
  usePageTitle('User Feedback – Xplaino Admin');
  const { accessToken } = useAuth();

  return (
    <Admin>
      <AdminUserFeedback accessToken={accessToken} />
    </Admin>
  );
};

AdminUserFeedbackPage.displayName = 'AdminUserFeedbackPage';
