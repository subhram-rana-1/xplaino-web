/**
 * Jotai atoms for paragraphs state management
 */

import { atom } from 'jotai';
import type { SavedParagraphsState } from '@/shared/types/paragraphs.types';

const initialSavedParagraphsState: SavedParagraphsState = {
  folder_id: null,
  user_id: '',
  sub_folders: [],
  saved_paragraphs: [],
  total: 0,
  offset: 0,
  limit: 20,
  has_next: false,
  isLoading: false,
  isLoaded: false,
  currentFolderPath: [],
};

export const savedParagraphsAtom = atom<SavedParagraphsState>(initialSavedParagraphsState);

