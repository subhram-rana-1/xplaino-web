/**
 * Paragraphs service
 * 
 * Handles API calls for saved paragraphs operations
 */

import { authConfig } from '@/config/auth.config';
import type { GetAllSavedParagraphsResponse, Folder } from '@/shared/types/paragraphs.types';

/**
 * Get all saved paragraphs with folders and pagination
 */
export async function getAllSavedParagraphs(
  accessToken: string,
  folderId: string | null = null,
  offset: number = 0,
  limit: number = 20
): Promise<GetAllSavedParagraphsResponse> {
  const folderIdParam = folderId ? `&folder_id=${folderId}` : '';
  const response = await fetch(
    `${authConfig.catenBaseUrl}/api/saved-paragraph/?offset=${offset}&limit=${limit}${folderIdParam}`,
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
    const errorData = await response.json().catch(() => ({ detail: 'Failed to fetch saved paragraphs' }));
    throw new Error(errorData.detail || `Failed to fetch saved paragraphs with status ${response.status}`);
  }

  const data: GetAllSavedParagraphsResponse = await response.json();
  return data;
}

/**
 * Delete a saved paragraph by ID
 */
export async function deleteSavedParagraph(
  accessToken: string,
  paragraphId: string
): Promise<void> {
  const response = await fetch(
    `${authConfig.catenBaseUrl}/api/saved-paragraph/${paragraphId}`,
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
    const errorData = await response.json().catch(() => ({ detail: 'Failed to delete saved paragraph' }));
    throw new Error(errorData.detail || `Failed to delete saved paragraph with status ${response.status}`);
  }
}

/**
 * Create a paragraph folder
 */
export async function createParagraphFolder(
  accessToken: string,
  name: string,
  parentFolderId: string | null = null
): Promise<Folder> {
  const response = await fetch(
    `${authConfig.catenBaseUrl}/api/saved-paragraph/folder`,
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
    `${authConfig.catenBaseUrl}/api/saved-paragraph/folder/${folderId}`,
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

