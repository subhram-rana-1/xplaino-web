/**
 * User Feedback service
 *
 * Handles API calls for user feedback operations
 */

import { authConfig } from '@/config/auth.config';
import { fetchWithAuth } from './api-client';
import type { GetAllUserFeedbacksResponse, GetAllUserFeedbacksFilters } from '@/shared/types/userFeedback.types';

/**
 * Get all user feedbacks (Admin only)
 * Requires ADMIN or SUPER_ADMIN role
 */
export async function getAllUserFeedbacks(
  _accessToken: string,
  filters?: GetAllUserFeedbacksFilters
): Promise<GetAllUserFeedbacksResponse> {
  const params = new URLSearchParams();

  if (filters?.verdict) {
    params.append('verdict', filters.verdict);
  }
  if (filters?.email) {
    params.append('email', filters.email);
  }
  if (filters?.offset !== undefined) {
    params.append('offset', filters.offset.toString());
  }
  if (filters?.limit !== undefined) {
    params.append('limit', filters.limit.toString());
  }

  const queryString = params.toString();
  const url = `${authConfig.catenBaseUrl}/api/user-feedback/all${queryString ? `?${queryString}` : ''}`;

  const response = await fetchWithAuth(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Failed to fetch user feedbacks' }));
    throw new Error(
      errorData.detail?.error_message ||
        errorData.detail ||
        `Failed to fetch user feedbacks with status ${response.status}`
    );
  }

  const data: GetAllUserFeedbacksResponse = await response.json();
  return data;
}
