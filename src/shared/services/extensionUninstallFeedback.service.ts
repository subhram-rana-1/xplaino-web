/**
 * Extension Uninstall Feedback service
 *
 * Handles API calls for extension uninstall feedback operations
 */

import { authConfig } from '@/config/auth.config';
import { fetchWithAuth } from './api-client';
import type {
  GetAllExtensionUninstallFeedbacksResponse,
  GetAllExtensionUninstallFeedbacksFilters,
} from '@/shared/types/extensionUninstallFeedback.types';

/**
 * Get all extension uninstall feedbacks (Admin only)
 * Requires ADMIN or SUPER_ADMIN role
 */
export async function getAllExtensionUninstallFeedbacks(
  _accessToken: string,
  filters?: GetAllExtensionUninstallFeedbacksFilters
): Promise<GetAllExtensionUninstallFeedbacksResponse> {
  const params = new URLSearchParams();

  if (filters?.reason) {
    params.append('reason', filters.reason);
  }
  if (filters?.created_at_from) {
    params.append('created_at_from', filters.created_at_from);
  }
  if (filters?.created_at_to) {
    params.append('created_at_to', filters.created_at_to);
  }
  if (filters?.offset !== undefined) {
    params.append('offset', filters.offset.toString());
  }
  if (filters?.limit !== undefined) {
    params.append('limit', filters.limit.toString());
  }

  const queryString = params.toString();
  const url = `${authConfig.catenBaseUrl}/api/extension-uninstall/feedbacks${queryString ? `?${queryString}` : ''}`;

  const response = await fetchWithAuth(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response
      .json()
      .catch(() => ({ detail: 'Failed to fetch extension uninstall feedbacks' }));
    throw new Error(
      errorData.detail?.error_message ||
        errorData.detail ||
        `Failed to fetch extension uninstall feedbacks with status ${response.status}`
    );
  }

  const data: GetAllExtensionUninstallFeedbacksResponse = await response.json();
  return data;
}
