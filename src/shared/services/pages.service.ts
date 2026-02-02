/**
 * Pages service
 * 
 * Handles API calls for saved pages operations
 */

import { authConfig } from '@/config/auth.config';
import { fetchWithAuth, extractErrorMessage } from './api-client';
import type { GetAllSavedPagesResponse, Folder } from '@/shared/types/pages.types';

/**
 * Get all saved pages with folders and pagination
 */
export async function getAllSavedPages(
  _accessToken: string,
  folderId: string | null = null,
  offset: number = 0,
  limit: number = 20
): Promise<GetAllSavedPagesResponse> {
  const folderIdParam = folderId ? `&folder_id=${folderId}` : '';
  const response = await fetchWithAuth(
    `${authConfig.catenBaseUrl}/api/saved-page/?offset=${offset}&limit=${limit}${folderIdParam}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(extractErrorMessage(errorData, 'Failed to fetch saved pages'));
  }

  const data: GetAllSavedPagesResponse = await response.json();
  return data;
}

/**
 * Delete a saved page by ID
 */
export async function deleteSavedPage(
  _accessToken: string,
  pageId: string
): Promise<void> {
  const response = await fetchWithAuth(
    `${authConfig.catenBaseUrl}/api/saved-page/${pageId}`,
    {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(extractErrorMessage(errorData, 'Failed to delete saved page'));
  }
}

/**
 * Create a page folder
 */
export async function createPageFolder(
  _accessToken: string,
  name: string,
  parentFolderId: string | null = null
): Promise<Folder> {
  const response = await fetchWithAuth(
    `${authConfig.catenBaseUrl}/api/saved-page/folder`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        parent_folder_id: parentFolderId,
      }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(extractErrorMessage(errorData, 'Failed to create folder'));
  }

  const data: Folder = await response.json();
  return data;
}

/**
 * Delete a folder by ID
 */
export async function deleteFolder(
  _accessToken: string,
  folderId: string
): Promise<void> {
  const response = await fetchWithAuth(
    `${authConfig.catenBaseUrl}/api/saved-page/folder/${folderId}`,
    {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(extractErrorMessage(errorData, 'Failed to delete folder'));
  }
}


