/**
 * Images service
 * 
 * Handles API calls for saved images operations
 */

import { authConfig } from '@/config/auth.config';
import { fetchWithAuth } from './api-client';
import type { GetAllSavedImagesResponse } from '@/shared/types/images.types';

/**
 * Get all saved images by folder ID with pagination
 */
export async function getAllSavedImagesByFolderId(
  accessToken: string,
  folderId: string,
  offset: number = 0,
  limit: number = 20
): Promise<GetAllSavedImagesResponse> {
  const response = await fetchWithAuth(
    `${authConfig.catenBaseUrl}/api/saved-image?folder-id=${folderId}&offset=${offset}&limit=${limit}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Failed to fetch saved images' }));
    throw new Error(errorData.detail || `Failed to fetch saved images with status ${response.status}`);
  }

  const data: GetAllSavedImagesResponse = await response.json();
  return data;
}

/**
 * Delete a saved image by ID
 */
export async function deleteSavedImage(
  accessToken: string,
  imageId: string
): Promise<void> {
  const response = await fetchWithAuth(
    `${authConfig.catenBaseUrl}/api/saved-image/${imageId}`,
    {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Failed to delete saved image' }));
    throw new Error(errorData.detail || `Failed to delete saved image with status ${response.status}`);
  }
}

/**
 * Move a saved image to a folder
 */
export async function moveSavedImageToFolder(
  accessToken: string,
  imageId: string,
  folderId: string | null
): Promise<void> {
  const response = await fetchWithAuth(
    `${authConfig.catenBaseUrl}/api/saved-image/${imageId}/move-to-folder`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ newFolderId: folderId }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Failed to move saved image' }));
    throw new Error(errorData.detail || `Failed to move saved image with status ${response.status}`);
  }
}

