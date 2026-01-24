/**
 * Features service
 * 
 * Handles API calls for features operations
 */

import { authConfig } from '@/config/auth.config';
import { fetchWithAuth } from './api-client';
import type { FeaturesResponse } from '@/shared/types/features.types';

/**
 * Get all features
 * Requires authentication and ADMIN or SUPER_ADMIN role
 */
export async function getFeatures(
  _accessToken: string
): Promise<FeaturesResponse> {
  const response = await fetchWithAuth(
    `${authConfig.catenBaseUrl}/api/feature`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Failed to fetch features' }));
    throw new Error(errorData.detail?.error_message || errorData.detail || `Failed to fetch features with status ${response.status}`);
  }

  const data: FeaturesResponse = await response.json();
  return data;
}
