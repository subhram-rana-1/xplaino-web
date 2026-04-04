import React from 'react';
import { Admin } from '../Admin';
import { AdminPricing } from '../components/AdminPricing';
import { useAuth } from '@/shared/hooks/useAuth';
import { usePageTitle } from '@/shared/hooks/usePageTitle';

/**
 * AdminPricingPage - Admin pricing management page
 * 
 * @returns JSX element
 */
export const AdminPricingPage: React.FC = () => {
  usePageTitle('Pricing Plans – Xplaino Admin');
  const { accessToken } = useAuth();

  return (
    <Admin>
      <AdminPricing accessToken={accessToken} />
    </Admin>
  );
};

AdminPricingPage.displayName = 'AdminPricingPage';

