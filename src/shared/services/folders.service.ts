/**
 * Folders service
 * 
 * Handles API calls for folder operations
 */

import { authConfig } from '@/config/auth.config';
import { fetchWithAuth, extractErrorMessage } from './api-client';
import type { GetAllFoldersResponse, CreateFolderRequest, CreateFolderResponse, RenameFolderRequest, RenameFolderResponse } from '@/shared/types/folders.types';

/**
 * Get all folders for the authenticated user
 */
export async function getAllFolders(
  _accessToken: string,
  type?: string
): Promise<GetAllFoldersResponse> {
  const url = type
    ? `${authConfig.catenBaseUrl}/api/folders?type=${encodeURIComponent(type)}`
    : `${authConfig.catenBaseUrl}/api/folders`;
  const response = await fetchWithAuth(
    url,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(extractErrorMessage(errorData, 'Failed to fetch folders'));
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
  parentId?: string,
  type?: string
): Promise<CreateFolderResponse> {
  const requestBody: CreateFolderRequest = {
    name,
    ...(parentId && { parentId }),
    ...(type && { type }),
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
    const errorData = await response.json().catch(() => ({}));
    throw new Error(extractErrorMessage(errorData, 'Failed to create folder'));
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
    const errorData = await response.json().catch(() => ({}));
    throw new Error(extractErrorMessage(errorData, 'Failed to delete folder'));
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
    const errorData = await response.json().catch(() => ({}));
    throw new Error(extractErrorMessage(errorData, 'Failed to rename folder'));
  }

  const data: RenameFolderResponse = await response.json();
  return data;
}

