/**
 * Pricing-related TypeScript types
 * 
 * Matches the API models from the Caten backend
 */

export interface CreatedByUser {
  id: string;
  name: string;
  role: string | null;
}

export interface PricingResponse {
  id: string;
  name: string;
  recurring_period: string; // 'MONTH' or 'YEAR'
  recurring_period_count: number;
  activation: string; // ISO format timestamp
  expiry: string; // ISO format timestamp
  status: string; // 'ENABLED' or 'DISABLED'
  features: string; // JSON string or formatted text
  created_by: CreatedByUser;
  created_at: string; // ISO format timestamp
  updated_at: string; // ISO format timestamp
}

export interface GetLivePricingsResponse {
  pricings: PricingResponse[];
}

export interface GetAllPricingsResponse {
  pricings: PricingResponse[];
}

export interface CreatePricingRequest {
  name: string;
  recurring_period: 'MONTH' | 'YEAR';
  recurring_period_count: number;
  activation: string; // ISO format timestamp
  expiry: string; // ISO format timestamp
  status: 'ENABLED' | 'DISABLED';
  features: string;
}

export interface UpdatePricingRequest {
  name?: string;
  activation?: string; // ISO format timestamp
  expiry?: string; // ISO format timestamp
  status?: 'ENABLED' | 'DISABLED';
  features?: string;
}

