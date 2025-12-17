/**
 * Pricing service
 * 
 * Handles API calls for pricing operations
 */

import { authConfig } from '@/config/auth.config';
import type { GetLivePricingsResponse, GetAllPricingsResponse, PricingResponse, CreatePricingRequest, UpdatePricingRequest } from '@/shared/types/pricing.types';

/**
 * Get all live pricing plans
 * No authentication required
 */
export async function getLivePricings(): Promise<GetLivePricingsResponse> {
  const response = await fetch(
    `${authConfig.catenBaseUrl}/api/pricing/live`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Source': 'XPLAINO_WEB',
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Failed to fetch pricings' }));
    throw new Error(errorData.detail?.error_message || errorData.detail || `Failed to fetch pricings with status ${response.status}`);
  }

  const data: GetLivePricingsResponse = await response.json();
  return data;
}

/**
 * Get all pricing plans
 * Requires authentication and ADMIN or SUPER_ADMIN role
 */
export async function getAllPricings(
  accessToken: string
): Promise<GetAllPricingsResponse> {
  const response = await fetch(
    `${authConfig.catenBaseUrl}/api/pricing/all`,
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
    const errorData = await response.json().catch(() => ({ detail: 'Failed to fetch pricings' }));
    throw new Error(errorData.detail?.error_message || errorData.detail || `Failed to fetch pricings with status ${response.status}`);
  }

  const data: GetAllPricingsResponse = await response.json();
  return data;
}

/**
 * Create a new pricing plan
 * Requires authentication and ADMIN or SUPER_ADMIN role
 */
export async function createPricing(
  accessToken: string,
  body: CreatePricingRequest
): Promise<PricingResponse> {
  const response = await fetch(
    `${authConfig.catenBaseUrl}/api/pricing/`,
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
    const errorData = await response.json().catch(() => ({ detail: 'Failed to create pricing' }));
    throw new Error(errorData.detail?.error_message || errorData.detail || `Failed to create pricing with status ${response.status}`);
  }

  const data: PricingResponse = await response.json();
  return data;
}

/**
 * Get a pricing plan by ID
 * Requires authentication and ADMIN or SUPER_ADMIN role
 */
export async function getPricingById(
  accessToken: string,
  pricingId: string
): Promise<PricingResponse> {
  const response = await fetch(
    `${authConfig.catenBaseUrl}/api/pricing/${pricingId}`,
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
    const errorData = await response.json().catch(() => ({ detail: 'Failed to fetch pricing' }));
    throw new Error(errorData.detail?.error_message || errorData.detail || `Failed to fetch pricing with status ${response.status}`);
  }

  const data: PricingResponse = await response.json();
  return data;
}

/**
 * Update a pricing plan
 * Requires authentication and ADMIN or SUPER_ADMIN role
 */
export async function updatePricing(
  accessToken: string,
  pricingId: string,
  body: UpdatePricingRequest
): Promise<PricingResponse> {
  const response = await fetch(
    `${authConfig.catenBaseUrl}/api/pricing/${pricingId}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'X-Source': 'XPLAINO_WEB',
      },
      body: JSON.stringify(body),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Failed to update pricing' }));
    throw new Error(errorData.detail?.error_message || errorData.detail || `Failed to update pricing with status ${response.status}`);
  }

  const data: PricingResponse = await response.json();
  return data;
}

/**
 * Delete a pricing plan
 * Requires authentication and ADMIN or SUPER_ADMIN role
 */
export async function deletePricing(
  accessToken: string,
  pricingId: string
): Promise<void> {
  const response = await fetch(
    `${authConfig.catenBaseUrl}/api/pricing/${pricingId}`,
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
    const errorData = await response.json().catch(() => ({ detail: 'Failed to delete pricing' }));
    throw new Error(errorData.detail?.error_message || errorData.detail || `Failed to delete pricing with status ${response.status}`);
  }
}

