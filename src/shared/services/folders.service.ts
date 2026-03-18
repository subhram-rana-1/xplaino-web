/**
 * Folders service
 * 
 * Handles API calls for folder operations
 */

import { authConfig } from '@/config/auth.config';
import { fetchWithAuth, extractErrorMessage } from './api-client';
import type {
  GetAllFoldersResponse,
  CreateFolderRequest,
  CreateFolderResponse,
  RenameFolderRequest,
  RenameFolderResponse,
  FolderShareResponse,
  GetSharedFoldersResponse,
  GetShareeListResponse,
} from '@/shared/types/folders.types';

/**
 * Get all folders for the authenticated user
 */
export async function getAllFolders(
  _accessToken: string
): Promise<GetAllFoldersResponse> {
  const url = `${authConfig.catenBaseUrl}/api/folders`;
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
 * Share a folder with another user by email
 */
export async function shareFolder(
  _accessToken: string,
  folderId: string,
  email: string
): Promise<FolderShareResponse> {
  const response = await fetchWithAuth(
    `${authConfig.catenBaseUrl}/api/folders/${folderId}/share`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(extractErrorMessage(errorData, 'Failed to share folder'));
  }

  return response.json() as Promise<FolderShareResponse>;
}

/**
 * Unshare a folder from a user by email
 */
export async function unshareFolder(
  _accessToken: string,
  folderId: string,
  email: string
): Promise<void> {
  const response = await fetchWithAuth(
    `${authConfig.catenBaseUrl}/api/folders/${folderId}/share`,
    {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(extractErrorMessage(errorData, 'Failed to unshare folder'));
  }
}

/**
 * Get the list of users (sharees) a folder has been shared with
 */
export async function getFolderShareeList(
  _accessToken: string,
  folderId: string
): Promise<GetShareeListResponse> {
  const response = await fetchWithAuth(
    `${authConfig.catenBaseUrl}/api/folders/${folderId}/share`,
    {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(extractErrorMessage(errorData, 'Failed to fetch folder sharee list'));
  }

  return response.json() as Promise<GetShareeListResponse>;
}

/**
 * Get all folders shared with the authenticated user
 */
export async function getSharedFolders(
  _accessToken: string
): Promise<GetSharedFoldersResponse> {
  const response = await fetchWithAuth(
    `${authConfig.catenBaseUrl}/api/folders/shared-with-me`,
    {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(extractErrorMessage(errorData, 'Failed to fetch shared folders'));
  }

  return response.json() as Promise<GetSharedFoldersResponse>;
}

/**
 * Get all emails that the current user has previously shared folders or PDFs with
 */
export async function getSharedToEmails(
  _accessToken: string
): Promise<string[]> {
  const response = await fetchWithAuth(
    `${authConfig.catenBaseUrl}/api/shared-users/emails`,
    {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    }
  );

  if (!response.ok) {
    return [];
  }

  const data = await response.json() as { emails: string[] };
  return data.emails ?? [];
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

