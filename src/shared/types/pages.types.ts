/**
 * Pages-related TypeScript types
 * 
 * Matches the API models from the Caten backend
 */

export interface Folder {
  id: string;
  name: string;
  type: string;
  parent_id: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface SavedPage {
  id: string;
  name: string | null;
  url: string;
  folder_id: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface GetAllSavedPagesResponse {
  folder_id: string | null;
  user_id: string;
  sub_folders: Folder[];
  saved_pages: SavedPage[];
  total: number;
  offset: number;
  limit: number;
  has_next: boolean;
}

export interface SavedPagesState {
  folder_id: string | null;
  user_id: string | null;
  sub_folders: Folder[];
  saved_pages: SavedPage[];
  total: number;
  offset: number;
  limit: number;
  has_next: boolean;
  isLoading: boolean;
  isLoaded: boolean;
  currentFolderPath: Array<{ id: string; name: string; parent_id: string | null }>;
}

