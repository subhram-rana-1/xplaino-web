/**
 * Coupon service
 * 
 * Handles API calls for coupon operations
 */

import { authConfig } from '@/config/auth.config';
import type {
  GetAllCouponsResponse,
  CouponResponse,
  CreateCouponRequest,
  UpdateCouponRequest,
  GetActiveHighlightedCouponResponse,
} from '@/shared/types/coupon.types';

export interface GetAllCouponsFilters {
  code?: string;
  name?: string;
  status?: string;
  is_active?: boolean;
}

/**
 * Get all coupons with optional filters and pagination
 * Requires authentication and ADMIN or SUPER_ADMIN role
 */
export async function getAllCoupons(
  accessToken: string,
  filters?: GetAllCouponsFilters,
  offset: number = 0,
  limit: number = 20
): Promise<GetAllCouponsResponse> {
  const params = new URLSearchParams();
  params.append('offset', offset.toString());
  params.append('limit', limit.toString());
  
  if (filters?.code) {
    params.append('code', filters.code);
  }
  if (filters?.name) {
    params.append('name', filters.name);
  }
  if (filters?.status) {
    params.append('status', filters.status);
  }
  if (filters?.is_active !== undefined) {
    params.append('is_active', filters.is_active.toString());
  }

  const response = await fetch(
    `${authConfig.catenBaseUrl}/api/coupon/?${params.toString()}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'X-Source': 'XPLAINO_WEB',
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Failed to fetch coupons' }));
    throw new Error(errorData.detail?.error_message || errorData.detail || `Failed to fetch coupons with status ${response.status}`);
  }

  const data: GetAllCouponsResponse = await response.json();
  return data;
}

/**
 * Get a coupon by ID
 * Requires authentication and ADMIN or SUPER_ADMIN role
 */
export async function getCouponById(
  accessToken: string,
  couponId: string
): Promise<CouponResponse> {
  const response = await fetch(
    `${authConfig.catenBaseUrl}/api/coupon/${couponId}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'X-Source': 'XPLAINO_WEB',
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Failed to fetch coupon' }));
    throw new Error(errorData.detail?.error_message || errorData.detail || `Failed to fetch coupon with status ${response.status}`);
  }

  const data: CouponResponse = await response.json();
  return data;
}

/**
 * Create a new coupon
 * Requires authentication and ADMIN or SUPER_ADMIN role
 */
export async function createCoupon(
  accessToken: string,
  body: CreateCouponRequest
): Promise<CouponResponse> {
  const response = await fetch(
    `${authConfig.catenBaseUrl}/api/coupon/`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'X-Source': 'XPLAINO_WEB',
      },
      body: JSON.stringify(body),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Failed to create coupon' }));
    throw new Error(errorData.detail?.error_message || errorData.detail || `Failed to create coupon with status ${response.status}`);
  }

  const data: CouponResponse = await response.json();
  return data;
}

/**
 * Update a coupon
 * Requires authentication and ADMIN or SUPER_ADMIN role
 */
export async function updateCoupon(
  accessToken: string,
  couponId: string,
  body: UpdateCouponRequest
): Promise<CouponResponse> {
  const response = await fetch(
    `${authConfig.catenBaseUrl}/api/coupon/${couponId}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'X-Source': 'XPLAINO_WEB',
      },
      body: JSON.stringify(body),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Failed to update coupon' }));
    throw new Error(errorData.detail?.error_message || errorData.detail || `Failed to update coupon with status ${response.status}`);
  }

  const data: CouponResponse = await response.json();
  return data;
}

/**
 * Delete a coupon
 * Requires authentication and ADMIN or SUPER_ADMIN role
 */
export async function deleteCoupon(
  accessToken: string,
  couponId: string
): Promise<void> {
  const response = await fetch(
    `${authConfig.catenBaseUrl}/api/coupon/${couponId}`,
    {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'X-Source': 'XPLAINO_WEB',
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Failed to delete coupon' }));
    throw new Error(errorData.detail?.error_message || errorData.detail || `Failed to delete coupon with status ${response.status}`);
  }
}

/**
 * Get the currently active highlighted coupon
 * No authentication required (public endpoint)
 */
export async function getActiveHighlightedCoupon(): Promise<GetActiveHighlightedCouponResponse> {
  const response = await fetch(
    `${authConfig.catenBaseUrl}/api/coupon/active-highlighted`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Source': 'XPLAINO_WEB',
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Failed to fetch active highlighted coupon' }));
    throw new Error(errorData.detail?.error_message || errorData.detail || `Failed to fetch active highlighted coupon with status ${response.status}`);
  }

  const data: GetActiveHighlightedCouponResponse = await response.json();
  return data;
}

