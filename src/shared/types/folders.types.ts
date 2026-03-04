/**
 * Folders-related TypeScript types
 * 
 * Matches the API models from the Caten backend
 */

export interface FolderWithSubFolders {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  subFolders: FolderWithSubFolders[];
}

export interface GetAllFoldersResponse {
  folders: FolderWithSubFolders[];
}

export interface CreateFolderRequest {
  name: string;
  parentId?: string;
}

export interface UserInfo {
  id: string;
  name: string;
  email: string;
  role?: string;
  firstName?: string | null;
  lastName?: string | null;
  picture?: string | null;
}

export interface CreateFolderResponse {
  id: string;
  name: string;
  parent_id: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
  user: UserInfo;
}

export interface RenameFolderRequest {
  name: string;
}

export interface RenameFolderResponse {
  id: string;
  name: string;
  parent_id: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface ShareResourceRequest {
  email: string;
}

export interface FolderShareResponse {
  id: string;
  folder_id: string;
  shared_to_email: string;
  created_at: string;
}

export interface SharedFolderItem {
  id: string;
  name: string;
  parent_id: string | null;
  user_id: string | null;
  created_at: string;
  updated_at: string;
  shared_at: string;
}

export interface GetSharedFoldersResponse {
  folders: SharedFolderItem[];
}

export interface ShareeItem {
  email: string;
  shared_at: string;
}

export interface GetShareeListResponse {
  sharees: ShareeItem[];
}

