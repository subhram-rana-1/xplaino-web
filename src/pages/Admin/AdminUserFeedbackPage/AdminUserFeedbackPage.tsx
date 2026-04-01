import React from 'react';
import { Admin } from '../Admin';
import { AdminUserFeedback } from '../components/AdminUserFeedback';
import { useAuth } from '@/shared/hooks/useAuth';

/**
 * AdminUserFeedbackPage - Admin user feedback management page
 *
 * @returns JSX element
 */
export const AdminUserFeedbackPage: React.FC = () => {
  const { accessToken } = useAuth();

  return (
    <Admin>
      <AdminUserFeedback accessToken={accessToken} />
    </Admin>
  );
};

AdminUserFeedbackPage.displayName = 'AdminUserFeedbackPage';
