import React from 'react';
import { Admin } from '../Admin';
import { AdminDomains } from '../components/AdminDomains';
import { useAuth } from '@/shared/hooks/useAuth';

/**
 * AdminDomainsPage - Admin domains management page
 * 
 * @returns JSX element
 */
export const AdminDomainsPage: React.FC = () => {
  const { accessToken } = useAuth();

  return (
    <Admin>
      <AdminDomains accessToken={accessToken} />
    </Admin>
  );
};

AdminDomainsPage.displayName = 'AdminDomainsPage';

