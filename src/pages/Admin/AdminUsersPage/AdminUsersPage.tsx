import React from 'react';
import { Admin } from '../Admin';
import { AdminUsers } from '../components/AdminUsers';
import { useAuth } from '@/shared/hooks/useAuth';
import { usePageTitle } from '@/shared/hooks/usePageTitle';

/**
 * AdminUsersPage - Admin user management page
 *
 * @returns JSX element
 */
export const AdminUsersPage: React.FC = () => {
  usePageTitle('Users – Xplaino Admin');
  const { accessToken } = useAuth();

  return (
    <Admin>
      <AdminUsers accessToken={accessToken} />
    </Admin>
  );
};

AdminUsersPage.displayName = 'AdminUsersPage';
