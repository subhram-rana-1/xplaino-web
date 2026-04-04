import React from 'react';
import { Admin } from '../Admin';
import { AdminTickets } from '../components/AdminTickets';
import { useAuth } from '@/shared/hooks/useAuth';
import { usePageTitle } from '@/shared/hooks/usePageTitle';

/**
 * AdminTicketsPage - Admin tickets management page
 * 
 * @returns JSX element
 */
export const AdminTicketsPage: React.FC = () => {
  usePageTitle('Support Tickets – Xplaino Admin');
  const { accessToken } = useAuth();

  return (
    <Admin>
      <AdminTickets accessToken={accessToken} />
    </Admin>
  );
};

AdminTicketsPage.displayName = 'AdminTicketsPage';

