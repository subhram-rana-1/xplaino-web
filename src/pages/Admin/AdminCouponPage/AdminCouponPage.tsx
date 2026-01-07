import React from 'react';
import { Admin } from '../Admin';
import { AdminCoupons } from '../components/AdminCoupons';
import { useAuth } from '@/shared/hooks/useAuth';

/**
 * AdminCouponPage - Admin coupon management page
 * 
 * @returns JSX element
 */
export const AdminCouponPage: React.FC = () => {
  const { accessToken } = useAuth();

  return (
    <Admin>
      <AdminCoupons accessToken={accessToken} />
    </Admin>
  );
};

AdminCouponPage.displayName = 'AdminCouponPage';

