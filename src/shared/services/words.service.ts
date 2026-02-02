/**
 * Words service
 * 
 * Handles API calls for saved words operations
 */

import { authConfig } from '@/config/auth.config';
import { fetchWithAuth, extractErrorMessage } from './api-client';
import type { GetSavedWordsResponse } from '@/shared/types/words.types';

/**
 * Get saved words with pagination
 */
export async function getSavedWords(
  _accessToken: string,
  offset: number = 0,
  limit: number = 20
): Promise<GetSavedWordsResponse> {
  const response = await fetchWithAuth(
    `${authConfig.catenBaseUrl}/api/saved-words/?offset=${offset}&limit=${limit}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(extractErrorMessage(errorData, 'Failed to fetch saved words'));
  }

  const data: GetSavedWordsResponse = await response.json();
  return data;
}

/**
 * Get saved words by folder ID with pagination
 */
export async function getSavedWordsByFolderId(
  _accessToken: string,
  folderId: string,
  offset: number = 0,
  limit: number = 20
): Promise<GetSavedWordsResponse> {
  const response = await fetchWithAuth(
    `${authConfig.catenBaseUrl}/api/saved-words?folder_id=${folderId}&offset=${offset}&limit=${limit}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(extractErrorMessage(errorData, 'Failed to fetch saved words'));
  }

  const data: GetSavedWordsResponse = await response.json();
  return data;
}

/**
 * Delete a saved word by ID
 */
export async function deleteSavedWord(
  _accessToken: string,
  wordId: string
): Promise<void> {
  const response = await fetchWithAuth(
    `${authConfig.catenBaseUrl}/api/saved-words/${wordId}`,
    {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(extractErrorMessage(errorData, 'Failed to delete saved word'));
  }
}

/**
 * Move a saved word to a folder
 */
export async function moveSavedWordToFolder(
  _accessToken: string,
  wordId: string,
  folderId: string | null
): Promise<void> {
  const response = await fetchWithAuth(
    `${authConfig.catenBaseUrl}/api/saved-words/${wordId}/move-to-folder`,
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
    throw new Error(extractErrorMessage(errorData, 'Failed to move saved word'));
  }
}

