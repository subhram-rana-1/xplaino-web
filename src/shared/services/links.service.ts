/**
 * Links service
 * 
 * Handles API calls for saved links operations
 */

import { authConfig } from '@/config/auth.config';
import { fetchWithAuth, extractErrorMessage } from './api-client';
import type { GetAllSavedLinksResponse, SavedLink } from '@/shared/types/links.types';

export interface SaveLinkRequest {
  url: string;
  name?: string | null;
  folder_id: string | null;
  summary?: string | null;
  metadata?: Record<string, any> | null;
}

/**
 * Get all saved links with folders and pagination
 */
export async function getAllSavedLinksByFolderId(
  _accessToken: string,
  folderId: string | null = null,
  offset: number = 0,
  limit: number = 20
): Promise<GetAllSavedLinksResponse> {
  const folderIdParam = folderId ? `&folder_id=${folderId}` : '';
  const response = await fetchWithAuth(
    `${authConfig.catenBaseUrl}/api/saved-link/?offset=${offset}&limit=${limit}${folderIdParam}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(extractErrorMessage(errorData, 'Failed to fetch saved links'));
  }

  const data: GetAllSavedLinksResponse = await response.json();
  return data;
}

/**
 * Save a new link
 */
export async function saveLink(
  _accessToken: string,
  body: SaveLinkRequest
): Promise<SavedLink> {
  const response = await fetchWithAuth(
    `${authConfig.catenBaseUrl}/api/saved-link/`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(extractErrorMessage(errorData, 'Failed to save link'));
  }

  const data: SavedLink = await response.json();
  return data;
}

/**
 * Delete a saved link by ID
 */
export async function deleteSavedLink(
  _accessToken: string,
  linkId: string
): Promise<void> {
  const response = await fetchWithAuth(
    `${authConfig.catenBaseUrl}/api/saved-link/${linkId}`,
    {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(extractErrorMessage(errorData, 'Failed to delete saved link'));
  }
}

/**
 * Move a saved link to a folder
 */
export async function moveSavedLinkToFolder(
  _accessToken: string,
  linkId: string,
  folderId: string | null
): Promise<SavedLink> {
  const response = await fetchWithAuth(
    `${authConfig.catenBaseUrl}/api/saved-link/${linkId}/move-to-folder`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ targetFolderId: folderId }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(extractErrorMessage(errorData, 'Failed to move saved link'));
  }

  const data: SavedLink = await response.json();
  return data;
}

