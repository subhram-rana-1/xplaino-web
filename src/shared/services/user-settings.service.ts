/**
 * User settings service
 * 
 * Handles API calls for user settings operations
 */

import { authConfig } from '@/config/auth.config';
import type {
  UserSettingsResponse,
  SettingsResponse,
  UpdateSettingsRequest,
  GetAllLanguagesResponse,
} from '@/shared/types/user-settings.types';

/**
 * Get user settings for the authenticated user
 */
export async function getUserSettings(
  accessToken: string
): Promise<UserSettingsResponse> {
  const response = await fetch(
    `${authConfig.catenBaseUrl}/api/user-settings`,
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
    const errorData = await response.json().catch(() => ({ detail: 'Failed to fetch user settings' }));
    throw new Error(errorData.detail?.error_message || errorData.detail || `Failed to fetch user settings with status ${response.status}`);
  }

  const data: UserSettingsResponse = await response.json();
  return data;
}

/**
 * Update user settings for the authenticated user
 */
export async function updateUserSettings(
  accessToken: string,
  body: UpdateSettingsRequest
): Promise<SettingsResponse> {
  const response = await fetch(
    `${authConfig.catenBaseUrl}/api/user-settings`,
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
    const errorData = await response.json().catch(() => ({ detail: 'Failed to update user settings' }));
    throw new Error(errorData.detail?.error_message || errorData.detail || `Failed to update user settings with status ${response.status}`);
  }

  const data: SettingsResponse = await response.json();
  return data;
}

/**
 * Get all supported languages
 * This is an unauthenticated endpoint
 */
export async function getAllLanguages(): Promise<GetAllLanguagesResponse> {
  const response = await fetch(
    `${authConfig.catenBaseUrl}/api/user-settings/languages`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Source': 'XPLAINO_WEB',
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Failed to fetch languages' }));
    throw new Error(errorData.detail?.error_message || errorData.detail || `Failed to fetch languages with status ${response.status}`);
  }

  const data: GetAllLanguagesResponse = await response.json();
  return data;
}

