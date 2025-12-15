import { atom } from 'jotai';
import type { SavedPagesState } from '@/shared/types/pages.types';

const initialSavedPagesState: SavedPagesState = {
  folder_id: null,
  user_id: null,
  sub_folders: [],
  saved_pages: [],
  total: 0,
  offset: 0,
  limit: 20,
  has_next: false,
  isLoading: false,
  isLoaded: false,
  currentFolderPath: [],
};

export const savedPagesAtom = atom<SavedPagesState>(initialSavedPagesState);

