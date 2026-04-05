import React from 'react';
import { Admin } from '../Admin';
import { AdminSubscriptions } from '../components/AdminSubscriptions';
import { useAuth } from '@/shared/hooks/useAuth';
import { usePageTitle } from '@/shared/hooks/usePageTitle';

/**
 * AdminSubscriptionsPage - Admin subscription management page
 *
 * @returns JSX element
 */
export const AdminSubscriptionsPage: React.FC = () => {
  usePageTitle('Subscriptions – Xplaino Admin');
  const { accessToken } = useAuth();

  return (
    <Admin>
      <AdminSubscriptions accessToken={accessToken} />
    </Admin>
  );
};

AdminSubscriptionsPage.displayName = 'AdminSubscriptionsPage';
