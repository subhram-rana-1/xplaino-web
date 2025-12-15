/**
 * Pages service
 * 
 * Handles API calls for saved pages operations
 */

import { authConfig } from '@/config/auth.config';
import type { GetAllSavedPagesResponse, Folder } from '@/shared/types/pages.types';

/**
 * Get all saved pages with folders and pagination
 */
export async function getAllSavedPages(
  accessToken: string,
  folderId: string | null = null,
  offset: number = 0,
  limit: number = 20
): Promise<GetAllSavedPagesResponse> {
  const folderIdParam = folderId ? `&folder_id=${folderId}` : '';
  const response = await fetch(
    `${authConfig.catenBaseUrl}/api/saved-page/?offset=${offset}&limit=${limit}${folderIdParam}`,
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
    const errorData = await response.json().catch(() => ({ detail: 'Failed to fetch saved pages' }));
    throw new Error(errorData.detail || `Failed to fetch saved pages with status ${response.status}`);
  }

  const data: GetAllSavedPagesResponse = await response.json();
  return data;
}

/**
 * Delete a saved page by ID
 */
export async function deleteSavedPage(
  accessToken: string,
  pageId: string
): Promise<void> {
  const response = await fetch(
    `${authConfig.catenBaseUrl}/api/saved-page/${pageId}`,
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
    const errorData = await response.json().catch(() => ({ detail: 'Failed to delete saved page' }));
    throw new Error(errorData.detail || `Failed to delete saved page with status ${response.status}`);
  }
}

/**
 * Create a page folder
 */
export async function createPageFolder(
  accessToken: string,
  name: string,
  parentFolderId: string | null = null
): Promise<Folder> {
  const response = await fetch(
    `${authConfig.catenBaseUrl}/api/saved-page/folder`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'X-Source': 'XPLAINO_WEB',
      },
      body: JSON.stringify({
        name,
        parent_folder_id: parentFolderId,
      }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Failed to create folder' }));
    throw new Error(errorData.detail || `Failed to create folder with status ${response.status}`);
  }

  const data: Folder = await response.json();
  return data;
}

/**
 * Delete a folder by ID
 */
export async function deleteFolder(
  accessToken: string,
  folderId: string
): Promise<void> {
  const response = await fetch(
    `${authConfig.catenBaseUrl}/api/saved-page/folder/${folderId}`,
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
    const errorData = await response.json().catch(() => ({ detail: 'Failed to delete folder' }));
    throw new Error(errorData.detail || `Failed to delete folder with status ${response.status}`);
  }
}

