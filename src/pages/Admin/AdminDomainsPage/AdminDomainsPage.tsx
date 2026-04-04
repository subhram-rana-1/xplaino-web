import React from 'react';
import { Admin } from '../Admin';
import { AdminDomains } from '../components/AdminDomains';
import { useAuth } from '@/shared/hooks/useAuth';
import { usePageTitle } from '@/shared/hooks/usePageTitle';

/**
 * AdminDomainsPage - Admin domains management page
 * 
 * @returns JSX element
 */
export const AdminDomainsPage: React.FC = () => {
  usePageTitle('Domain Management – Xplaino Admin');
  const { accessToken } = useAuth();

  return (
    <Admin>
      <AdminDomains accessToken={accessToken} />
    </Admin>
  );
};

AdminDomainsPage.displayName = 'AdminDomainsPage';

