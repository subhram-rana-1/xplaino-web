import React from 'react';
import { Admin } from '../Admin';
import { AdminPricing } from '../components/AdminPricing';
import { useAuth } from '@/shared/hooks/useAuth';

/**
 * AdminPricingPage - Admin pricing management page
 * 
 * @returns JSX element
 */
export const AdminPricingPage: React.FC = () => {
  const { accessToken } = useAuth();

  return (
    <Admin>
      <AdminPricing accessToken={accessToken} />
    </Admin>
  );
};

AdminPricingPage.displayName = 'AdminPricingPage';

