/**
 * Coupon-related TypeScript types
 * 
 * Matches the API models from the Caten backend
 */

export type CouponStatus = 'ENABLED' | 'DISABLED';

export interface UserInfo {
  id: string;
  name: string;
  email: string | null;
  role: string | null;
}

export interface CouponResponse {
  id: string;
  code: string;
  name: string;
  description: string;
  discount: number; // 0-100
  activation: string; // ISO format timestamp
  expiry: string; // ISO format timestamp
  status: string; // 'ENABLED' or 'DISABLED'
  is_highlighted: boolean;
  created_by: UserInfo;
  created_at: string; // ISO format timestamp
  updated_at: string; // ISO format timestamp
}

export interface GetAllCouponsResponse {
  coupons: CouponResponse[];
  total: number;
  offset: number;
  limit: number;
  has_next: boolean;
}

export interface CreateCouponRequest {
  code: string; // 1-30 characters
  name: string; // 1-100 characters
  description: string; // 1-1024 characters
  discount: number; // > 0 and <= 100
  activation: string; // ISO format timestamp
  expiry: string; // ISO format timestamp
  status: CouponStatus;
}

export interface UpdateCouponRequest {
  code?: string; // 1-30 characters
  name?: string; // 1-100 characters
  description?: string; // 1-1024 characters
  discount?: number; // > 0 and <= 100
  activation?: string; // ISO format timestamp
  expiry?: string; // ISO format timestamp
  status?: CouponStatus;
  is_highlighted?: boolean;
}

export interface GetActiveHighlightedCouponResponse {
  code: string | null; // "NO_ACTIVE_HIGHLIGHTED_COUPON" if none
  id?: string;
  coupon_code?: string;
  name?: string;
  description?: string;
  discount?: number;
  activation?: string;
  expiry?: string;
  status?: string;
  is_highlighted?: boolean;
}

