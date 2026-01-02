import React from 'react';
import { Admin } from '../Admin';
import { AdminTickets } from '../components/AdminTickets';
import { useAuth } from '@/shared/hooks/useAuth';

/**
 * AdminTicketsPage - Admin tickets management page
 * 
 * @returns JSX element
 */
export const AdminTicketsPage: React.FC = () => {
  const { accessToken } = useAuth();

  return (
    <Admin>
      <AdminTickets accessToken={accessToken} />
    </Admin>
  );
};

AdminTicketsPage.displayName = 'AdminTicketsPage';

