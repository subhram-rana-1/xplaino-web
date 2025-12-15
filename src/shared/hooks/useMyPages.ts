/**
 * Custom hook for managing my pages state
 */

import { useAtom } from 'jotai';
import { useCallback } from 'react';
import { savedPagesAtom } from '@/shared/atoms/pages.atom';
import {
  getAllSavedPages,
  deleteSavedPage,
  createPageFolder,
  deleteFolder,
} from '@/shared/services/pages.service';
import type { SavedPagesState } from '@/shared/types/pages.types';

export interface UseMyPagesReturn {
  state: SavedPagesState;
  fetchPages: (folderId: string | null, offset: number, limit: number, accessToken: string) => Promise<void>;
  deletePage: (pageId: string, accessToken: string) => Promise<void>;
  deleteFolder: (folderId: string, accessToken: string) => Promise<void>;
  createFolder: (name: string, parentFolderId: string | null, accessToken: string) => Promise<void>;
  navigateToFolder: (folderId: string, folderName: string, accessToken: string) => Promise<void>;
  navigateToParent: (accessToken: string) => Promise<void>;
  resetPages: () => void;
}

export function useMyPages(): UseMyPagesReturn {
  const [state, setState] = useAtom(savedPagesAtom);

  const fetchPages = useCallback(
    async (folderId: string | null, offset: number, limit: number, accessToken: string) => {
      // Only fetch if not already loaded or if folder/pagination changed
      if (
        state.isLoaded &&
        state.folder_id === folderId &&
        state.offset === offset &&
        state.limit === limit
      ) {
        return;
      }

      setState((prev) => ({ ...prev, isLoading: true }));

      try {
        const response = await getAllSavedPages(accessToken, folderId, offset, limit);
        setState((prev) => ({
          folder_id: response.folder_id,
          user_id: response.user_id,
          sub_folders: response.sub_folders,
          saved_pages: response.saved_pages,
          total: response.total,
          offset: response.offset,
          limit: response.limit,
          has_next: response.has_next,
          isLoading: false,
          isLoaded: true,
          currentFolderPath: prev.currentFolderPath, // Preserve path, will be updated by navigateToFolder
        }));
      } catch (error) {
        console.error('Error fetching pages:', error);
        setState((prev) => ({ ...prev, isLoading: false }));
        throw error;
      }
    },
    [state.isLoaded, state.folder_id, state.offset, state.limit, state.currentFolderPath, setState]
  );

  const deletePage = useCallback(
    async (pageId: string, accessToken: string) => {
      // Optimistically remove page from state
      setState((prev) => ({
        ...prev,
        saved_pages: prev.saved_pages.filter((page) => page.id !== pageId),
        total: Math.max(0, prev.total - 1),
      }));

      try {
        await deleteSavedPage(accessToken, pageId);
        // If we're on the last page and it becomes empty, go to previous page
        setState((prev) => {
          const remainingPages = prev.saved_pages.length;

          // If current page is empty and we're not on the first page, go to previous page
          if (remainingPages === 0 && prev.offset > 0) {
            const newOffset = Math.max(0, prev.offset - prev.limit);
            // Trigger refetch by resetting isLoaded
            return {
              ...prev,
              offset: newOffset,
              isLoaded: false,
            };
          }

          return prev;
        });
      } catch (error) {
        console.error('Error deleting page:', error);
        // Revert optimistic update by refetching
        setState((prev) => ({
          ...prev,
          isLoaded: false,
        }));
        throw error;
      }
    },
    [setState]
  );

  const createFolder = useCallback(
    async (name: string, parentFolderId: string | null, accessToken: string) => {
      try {
        const newFolder = await createPageFolder(accessToken, name, parentFolderId);
        // Add new folder to state
        setState((prev) => ({
          ...prev,
          sub_folders: [...prev.sub_folders, newFolder],
        }));
      } catch (error) {
        console.error('Error creating folder:', error);
        throw error;
      }
    },
    [setState]
  );

  const navigateToFolder = useCallback(
    async (folderId: string, folderName: string, accessToken: string) => {
      // Update folder path
      setState((prev) => ({
        ...prev,
        currentFolderPath: [...prev.currentFolderPath, { id: folderId, name: folderName, parent_id: prev.folder_id }],
        isLoaded: false, // Reset to trigger fetch
      }));

      // Fetch data for the new folder
      await fetchPages(folderId, 0, state.limit, accessToken);
    },
    [state.limit, state.folder_id, fetchPages, setState]
  );

  const navigateToParent = useCallback(
    async (accessToken: string) => {
      // Get parent folder ID from current folder path
      let parentFolderId: string | null = null;
      let newPath: Array<{ id: string; name: string; parent_id: string | null }> = [];

      setState((prev) => {
        if (prev.currentFolderPath.length === 0) {
          return prev; // Already at root
        }

        newPath = prev.currentFolderPath.slice(0, -1);
        parentFolderId = newPath.length > 0 ? newPath[newPath.length - 1].id : null;

        return {
          ...prev,
          currentFolderPath: newPath,
          folder_id: parentFolderId,
          isLoaded: false, // Reset to trigger fetch
        };
      });

      // Fetch data for parent folder
      await fetchPages(parentFolderId, 0, state.limit, accessToken);
    },
    [state.limit, fetchPages, setState]
  );

  const deleteFolderHandler = useCallback(
    async (folderId: string, accessToken: string) => {
      // Store previous state for potential revert
      let previousFolders: typeof state.sub_folders = [];
      let currentFolderId: string | null = null;
      let currentPathLength: number = 0;

      // Optimistically remove folder from state
      setState((prev) => {
        previousFolders = prev.sub_folders;
        currentFolderId = prev.folder_id;
        currentPathLength = prev.currentFolderPath.length;
        return {
          ...prev,
          sub_folders: prev.sub_folders.filter((folder) => folder.id !== folderId),
        };
      });

      try {
        await deleteFolder(accessToken, folderId);
        // If we deleted the current folder, navigate to parent
        if (currentFolderId === folderId && currentPathLength > 0) {
          // Navigate to parent folder
          await navigateToParent(accessToken);
        }
      } catch (error) {
        console.error('Error deleting folder:', error);
        // Revert optimistic update
        setState((prev) => ({
          ...prev,
          sub_folders: previousFolders,
        }));
        throw error;
      }
    },
    [deleteFolder, navigateToParent, setState]
  );

  const resetPages = useCallback(() => {
    setState({
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
    });
  }, [setState]);

  return {
    state,
    fetchPages,
    deletePage,
    deleteFolder: deleteFolderHandler,
    createFolder,
    navigateToFolder,
    navigateToParent,
    resetPages,
  };
}

