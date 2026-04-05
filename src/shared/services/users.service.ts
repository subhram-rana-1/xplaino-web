/**
 * Users service
 *
 * Handles API calls for admin user management operations
 */

import { authConfig } from '@/config/auth.config';
import { fetchWithAuth } from './api-client';
import type { GetAllUsersResponse, GetAllUsersFilters } from '@/shared/types/users.types';

/**
 * Get all users (Admin only)
 * Requires ADMIN or SUPER_ADMIN role
 */
export async function getAllUsers(
  _accessToken: string,
  filters?: GetAllUsersFilters
): Promise<GetAllUsersResponse> {
  const params = new URLSearchParams();

  if (filters?.email) {
    params.append('email', filters.email);
  }
  if (filters?.role) {
    params.append('role', filters.role);
  }
  if (filters?.offset !== undefined) {
    params.append('offset', filters.offset.toString());
  }
  if (filters?.limit !== undefined) {
    params.append('limit', filters.limit.toString());
  }

  const queryString = params.toString();
  const url = `${authConfig.catenBaseUrl}/api/users${queryString ? `?${queryString}` : ''}`;

  const response = await fetchWithAuth(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Failed to fetch users' }));
    throw new Error(
      errorData.detail?.error_message || errorData.detail || `Failed to fetch users with status ${response.status}`
    );
  }

  const data: GetAllUsersResponse = await response.json();
  return data;
}
