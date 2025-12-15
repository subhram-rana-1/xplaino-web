/**
 * Paragraphs-related TypeScript types
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

export interface SavedParagraph {
  id: string;
  name: string | null;
  source_url: string;
  content: string;
  folder_id: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface GetAllSavedParagraphsResponse {
  folder_id: string | null;
  user_id: string;
  sub_folders: Folder[];
  saved_paragraphs: SavedParagraph[];
  total: number;
  offset: number;
  limit: number;
  has_next: boolean;
}

export interface SavedParagraphsState {
  folder_id: string | null;
  user_id: string;
  sub_folders: Folder[];
  saved_paragraphs: SavedParagraph[];
  total: number;
  offset: number;
  limit: number;
  has_next: boolean;
  isLoading: boolean;
  isLoaded: boolean;
  currentFolderPath: Array<{ id: string; name: string }>;
}

