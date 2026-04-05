/**
 * Admin Subscriptions service
 *
 * Handles API calls for admin subscription management
 */

import { authConfig } from '@/config/auth.config';
import { fetchWithAuth } from './api-client';
import type { GetAllSubscriptionsResponse, GetAllSubscriptionsFilters } from '@/shared/types/subscription.types';

/**
 * Get all subscriptions (Admin only)
 * Requires ADMIN or SUPER_ADMIN role
 */
export async function getAllSubscriptions(
  _accessToken: string,
  filters?: GetAllSubscriptionsFilters
): Promise<GetAllSubscriptionsResponse> {
  const params = new URLSearchParams();

  if (filters?.status) {
    params.append('status', filters.status);
  }
  if (filters?.offset !== undefined) {
    params.append('offset', filters.offset.toString());
  }
  if (filters?.limit !== undefined) {
    params.append('limit', filters.limit.toString());
  }

  const queryString = params.toString();
  const url = `${authConfig.catenBaseUrl}/api/admin/subscriptions${queryString ? `?${queryString}` : ''}`;

  const response = await fetchWithAuth(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Failed to fetch subscriptions' }));
    throw new Error(
      errorData.detail?.error_message ||
        errorData.detail ||
        `Failed to fetch subscriptions with status ${response.status}`
    );
  }

  const data: GetAllSubscriptionsResponse = await response.json();
  return data;
}
