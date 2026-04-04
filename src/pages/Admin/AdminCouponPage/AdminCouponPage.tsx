import React from 'react';
import { Admin } from '../Admin';
import { AdminCoupons } from '../components/AdminCoupons';
import { useAuth } from '@/shared/hooks/useAuth';
import { usePageTitle } from '@/shared/hooks/usePageTitle';

/**
 * AdminCouponPage - Admin coupon management page
 * 
 * @returns JSX element
 */
export const AdminCouponPage: React.FC = () => {
  usePageTitle('Coupon Management – Xplaino Admin');
  const { accessToken } = useAuth();

  return (
    <Admin>
      <AdminCoupons accessToken={accessToken} />
    </Admin>
  );
};

AdminCouponPage.displayName = 'AdminCouponPage';

