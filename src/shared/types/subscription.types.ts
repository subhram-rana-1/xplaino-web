/**
 * Subscription TypeScript Types
 * 
 * Type definitions for subscription API responses and data structures
 * Matches backend contract at /api/subscription/{user_id}
 */

/**
 * Subscription status enum
 */
export enum SubscriptionStatus {
  ACTIVE = 'active',
  CANCELED = 'canceled',
  PAST_DUE = 'past_due',
  PAUSED = 'paused',
  TRIALING = 'trialing',
}

/**
 * Billing interval type (uppercase as returned from backend)
 */
export type BillingInterval = 'DAY' | 'WEEK' | 'MONTH' | 'YEAR';

// =====================================================
// PADDLE RAW ITEM TYPES (from Paddle API via backend)
// =====================================================

/**
 * Paddle price unit price
 */
export interface PaddleUnitPrice {
  amount: string;
  currency_code: string;
}

/**
 * Paddle billing cycle
 */
export interface PaddleBillingCycle {
  interval: string;
  frequency: number;
}

/**
 * Paddle price details (raw from Paddle)
 */
export interface PaddlePrice {
  id: string;
  name: string;
  type: string;
  status: string;
  quantity?: {
    maximum: number;
    minimum: number;
  };
  tax_mode?: string;
  created_at: string;
  product_id: string;
  unit_price: PaddleUnitPrice;
  updated_at: string;
  custom_data?: unknown;
  description?: string;
  import_meta?: unknown;
  trial_period?: unknown;
  billing_cycle: PaddleBillingCycle | null;
  unit_price_overrides?: unknown[];
}

/**
 * Paddle product details (raw from Paddle)
 */
export interface PaddleProduct {
  id: string;
  name: string;
  type: string;
  status: string;
  image_url?: string;
  created_at: string;
  updated_at: string;
  custom_data?: unknown;
  description?: string;
  import_meta?: unknown;
  tax_category?: string;
}

/**
 * Paddle subscription item (raw from Paddle)
 */
export interface PaddleSubscriptionItem {
  price: PaddlePrice;
  status: string;
  product: PaddleProduct;
  quantity: number;
  recurring: boolean;
  created_at: string;
  updated_at: string;
  trial_dates?: unknown;
  next_billed_at: string | null;
  previously_billed_at: string | null;
}

// =====================================================
// BACKEND RESPONSE TYPES
// =====================================================

/**
 * Paddle customer response from backend
 */
export interface PaddleCustomerResponse {
  id: string;
  paddle_customer_id: string;
  user_id: string | null;
  email: string;
  name: string | null;
  locale: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

/**
 * Paddle subscription response from backend
 */
export interface PaddleSubscriptionResponse {
  id: string;
  paddle_subscription_id: string;
  paddle_customer_id: string;
  user_id: string | null;
  status: string;
  currency_code: string;
  billing_cycle_interval: BillingInterval;
  billing_cycle_frequency: number;
  current_billing_period_starts_at: string | null;
  current_billing_period_ends_at: string | null;
  next_billed_at: string | null;
  paused_at: string | null;
  canceled_at: string | null;
  items: PaddleSubscriptionItem[];
  created_at: string;
  updated_at: string;
}

/**
 * API response for GET /api/subscription/{user_id}
 */
export interface GetUserSubscriptionResponse {
  has_active_subscription: boolean;
  subscription: PaddleSubscriptionResponse | null;
  customer: PaddleCustomerResponse | null;
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Extract plan name from subscription items
 */
export function getPlanName(subscription: PaddleSubscriptionResponse | null): string | null {
  if (!subscription?.items?.length) return null;
  return subscription.items[0]?.price?.name ?? null;
}

/**
 * Format price from Paddle unit_price
 */
export function formatSubscriptionPrice(subscription: PaddleSubscriptionResponse | null): string | null {
  if (!subscription?.items?.length) return null;
  
  const item = subscription.items[0];
  if (!item?.price?.unit_price) return null;
  
  const amount = parseInt(item.price.unit_price.amount, 10) / 100;
  const currency = item.price.unit_price.currency_code;
  const billingCycle = item.price.billing_cycle;
  
  if (!billingCycle) {
    return `${currency} ${amount.toFixed(2)}`;
  }
  
  const intervalLabel = billingCycle.interval.toLowerCase();
  return `${currency} ${amount.toFixed(2)}/${intervalLabel}`;
}

/**
 * Get subscription status as enum
 */
export function getSubscriptionStatusEnum(status: string): SubscriptionStatus {
  const statusLower = status.toLowerCase();
  switch (statusLower) {
    case 'active':
      return SubscriptionStatus.ACTIVE;
    case 'canceled':
      return SubscriptionStatus.CANCELED;
    case 'past_due':
      return SubscriptionStatus.PAST_DUE;
    case 'paused':
      return SubscriptionStatus.PAUSED;
    case 'trialing':
      return SubscriptionStatus.TRIALING;
    default:
      return SubscriptionStatus.CANCELED;
  }
}
