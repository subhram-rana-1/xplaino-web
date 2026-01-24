/**
 * Folders service
 * 
 * Handles API calls for folder operations
 */

import { authConfig } from '@/config/auth.config';
import { fetchWithAuth } from './api-client';
import type { GetAllFoldersResponse, CreateFolderRequest, CreateFolderResponse, RenameFolderRequest, RenameFolderResponse } from '@/shared/types/folders.types';

/**
 * Get all folders for the authenticated user
 */
export async function getAllFolders(
  _accessToken: string
): Promise<GetAllFoldersResponse> {
  const response = await fetchWithAuth(
    `${authConfig.catenBaseUrl}/api/folders`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Failed to fetch folders' }));
    throw new Error(errorData.detail || `Failed to fetch folders with status ${response.status}`);
  }

  const data: GetAllFoldersResponse = await response.json();
  return data;
}

/**
 * Create a new folder for the authenticated user
 */
export async function createFolder(
  _accessToken: string,
  name: string,
  parentId?: string
): Promise<CreateFolderResponse> {
  const requestBody: CreateFolderRequest = {
    name,
    ...(parentId && { parentId }),
  };

  const response = await fetchWithAuth(
    `${authConfig.catenBaseUrl}/api/folders`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Failed to create folder' }));
    const errorMessage = errorData.detail || errorData.error_message || `Failed to create folder with status ${response.status}`;
    throw new Error(errorMessage);
  }

  const data: CreateFolderResponse = await response.json();
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
    `${authConfig.catenBaseUrl}/api/folders/${folderId}`,
    {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Failed to delete folder' }));
    throw new Error(errorData.detail || `Failed to delete folder with status ${response.status}`);
  }
}

/**
 * Rename a folder by ID
 */
export async function renameFolder(
  _accessToken: string,
  folderId: string,
  name: string
): Promise<RenameFolderResponse> {
  const requestBody: RenameFolderRequest = {
    name,
  };

  const response = await fetchWithAuth(
    `${authConfig.catenBaseUrl}/api/folders/${folderId}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Failed to rename folder' }));
    const errorMessage = errorData.detail || errorData.error_message || `Failed to rename folder with status ${response.status}`;
    throw new Error(errorMessage);
  }

  const data: RenameFolderResponse = await response.json();
  return data;
}

