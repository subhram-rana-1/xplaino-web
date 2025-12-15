import React, { useEffect, useState } from 'react';
import { FiArrowLeft, FiTrash2, FiExternalLink, FiFolderPlus } from 'react-icons/fi';
import styles from './MyPages.module.css';
import { useAuth } from '@/shared/hooks/useAuth';
import { LoginModal } from '@/shared/components/LoginModal';
import { useMyPages } from '@/shared/hooks/useMyPages';
import { FolderIcon } from '@/shared/components/FolderIcon';
import { CreateFolderModal } from '@/shared/components/CreateFolderModal';
import { ChromeButton } from '@/shared/components/ChromeButton';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { Toast } from '@/shared/components/Toast';

/**
 * MyPages - My Pages page component
 * 
 * @returns JSX element
 */
export const MyPages: React.FC = () => {
  const { isLoggedIn, accessToken } = useAuth();
  const {
    state,
    fetchPages,
    deletePage,
    deleteFolder,
    createFolder,
    navigateToFolder,
    navigateToParent,
  } = useMyPages();
  const [deletingPageId, setDeletingPageId] = useState<string | null>(null);
  const [deletingFolderId, setDeletingFolderId] = useState<string | null>(null);
  const [isCreateFolderModalOpen, setIsCreateFolderModalOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    folderId: string | null;
    folderName: string | null;
  }>({ isOpen: false, folderId: null, folderName: null });
  const [toast, setToast] = useState<{ message: string } | null>(null);

  useEffect(() => {
    if (isLoggedIn && accessToken && !state.isLoaded && !state.isLoading) {
      fetchPages(null, 0, 20, accessToken).catch((error) => {
        console.error('Error fetching pages:', error);
      });
    }
  }, [isLoggedIn, accessToken, state.isLoaded, state.isLoading, fetchPages]);

  // Refetch if offset changed and we need new data
  useEffect(() => {
    if (isLoggedIn && accessToken && state.isLoaded && !state.isLoading) {
      const needsRefetch = state.saved_pages.length === 0 && state.offset > 0 && state.total > 0;
      if (needsRefetch) {
        fetchPages(state.folder_id, state.offset, state.limit, accessToken).catch((error) => {
          console.error('Error fetching pages:', error);
        });
      }
    }
  }, [state.offset, isLoggedIn, accessToken, state.isLoaded, state.isLoading, state.saved_pages.length, state.total, state.folder_id, fetchPages]);

  const handleFolderClick = (folderId: string, folderName: string) => {
    if (accessToken) {
      navigateToFolder(folderId, folderName, accessToken).catch((error) => {
        console.error('Error navigating to folder:', error);
      });
    }
  };

  const handleBackClick = () => {
    if (accessToken) {
      navigateToParent(accessToken).catch((error) => {
        console.error('Error navigating to parent:', error);
      });
    }
  };

  const handleDeletePage = async (pageId: string) => {
    if (!accessToken) return;

    try {
      setDeletingPageId(pageId);
      await deletePage(pageId, accessToken);
      setToast({ message: 'Page deleted successfully' });
      // If we deleted and need to refetch, it will be handled by the hook
      if (state.saved_pages.length === 0 && state.offset > 0) {
        await fetchPages(state.folder_id, state.offset, state.limit, accessToken);
      }
    } catch (error) {
      console.error('Error deleting page:', error);
    } finally {
      setDeletingPageId(null);
    }
  };

  const handleDeleteFolderClick = (folderId: string, folderName: string) => {
    setConfirmDialog({ isOpen: true, folderId, folderName });
  };

  const handleConfirmDeleteFolder = async () => {
    if (!accessToken || !confirmDialog.folderId) return;

    try {
      setDeletingFolderId(confirmDialog.folderId);
      setConfirmDialog({ isOpen: false, folderId: null, folderName: null });
      await deleteFolder(confirmDialog.folderId, accessToken);
      setToast({ message: 'Folder deleted successfully' });
    } catch (error) {
      console.error('Error deleting folder:', error);
    } finally {
      setDeletingFolderId(null);
    }
  };

  const handleCancelDeleteFolder = () => {
    setConfirmDialog({ isOpen: false, folderId: null, folderName: null });
  };

  const handleCreateFolder = async (name: string) => {
    if (!accessToken) return;
    await createFolder(name, state.folder_id, accessToken);
  };

  const handlePrevious = () => {
    if (state.offset > 0 && accessToken) {
      const newOffset = Math.max(0, state.offset - state.limit);
      fetchPages(state.folder_id, newOffset, state.limit, accessToken).catch((error) => {
        console.error('Error fetching pages:', error);
      });
    }
  };

  const handleNext = () => {
    if (state.has_next && accessToken) {
      const newOffset = state.offset + state.limit;
      fetchPages(state.folder_id, newOffset, state.limit, accessToken).catch((error) => {
        console.error('Error fetching pages:', error);
      });
    }
  };

  if (!isLoggedIn) {
    return (
      <div className={styles.myPages}>
        <LoginModal actionText="view your saved pages" />
      </div>
    );
  }

  const hasParent = state.currentFolderPath.length > 0;
  const currentFolderName = state.currentFolderPath.length > 0
    ? state.currentFolderPath[state.currentFolderPath.length - 1].name
    : undefined;
  const isEmpty = state.sub_folders.length === 0 && state.saved_pages.length === 0 && !state.isLoading;
  const startIndex = state.offset + 1;
  const endIndex = Math.min(state.offset + state.limit, state.total);
  const canGoPrevious = state.offset > 0;
  const canGoNext = state.has_next;

  return (
    <div className={styles.myPages}>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            {hasParent && (
              <button
                className={styles.backButton}
                onClick={handleBackClick}
                aria-label="Go back to parent folder"
                title="Go back"
              >
                <FiArrowLeft />
              </button>
            )}
            {state.currentFolderPath.length > 0 && (
              <div className={styles.breadcrumb}>
                {state.currentFolderPath.map((folder, index) => (
                  <span key={folder.id}>
                    {index > 0 && ' > '}
                    {index === state.currentFolderPath.length - 1 ? (
                      <span className={styles.currentFolder}>
                        {folder.name}
                      </span>
                    ) : (
                      <button
                        className={styles.breadcrumbLink}
                        onClick={() => {
                          if (accessToken) {
                            const navigateToTargetFolder = async () => {
                              const targetIndex = index;
                              const currentDepth = state.currentFolderPath.length;
                              const targetDepth = targetIndex + 1;
                              const levelsToGoBack = currentDepth - targetDepth;
                              
                              for (let i = 0; i < levelsToGoBack; i++) {
                                await navigateToParent(accessToken);
                                await new Promise(resolve => setTimeout(resolve, 100));
                              }
                            };
                            navigateToTargetFolder().catch(console.error);
                          }
                        }}
                      >
                        {folder.name}
                      </button>
                    )}
                  </span>
                ))}
              </div>
            )}
          </div>
          <button
            className={styles.createFolderButton}
            onClick={() => setIsCreateFolderModalOpen(true)}
            aria-label="Create folder"
            title="Create folder"
          >
            <FiFolderPlus />
            <span>Create Folder</span>
          </button>
        </div>

        {/* Loading State */}
        {state.isLoading && state.sub_folders.length === 0 && state.saved_pages.length === 0 ? (
          <div className={styles.loading}>Loading...</div>
        ) : isEmpty ? (
          /* Empty State */
          <div className={styles.emptyState}>
            <h2 className={styles.emptyHeading}>No saved pages yet</h2>
            <p className={styles.emptyMessage}>
              Start gathering important pages
            </p>
            <div className={styles.chromeButtonContainer}>
              <ChromeButton />
            </div>
          </div>
        ) : (
          <>
            {/* Folders Section */}
            {state.sub_folders.length > 0 && (
              <div className={styles.foldersSection}>
                <h3 className={styles.sectionTitle}>Folders</h3>
                <div className={styles.foldersGrid}>
                  {state.sub_folders.map((folder) => (
                    <div key={folder.id} className={styles.folderItem}>
                      <button
                        className={styles.folderButton}
                        onClick={() => handleFolderClick(folder.id, folder.name)}
                      >
                        <FolderIcon size={32} />
                        <span className={styles.folderName}>{folder.name}</span>
                      </button>
                      <button
                        className={styles.deleteButton}
                        onClick={() => handleDeleteFolderClick(folder.id, folder.name)}
                        disabled={deletingFolderId === folder.id}
                        aria-label={`Delete folder ${folder.name}`}
                        title="Delete folder"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pages Section */}
            {state.saved_pages.length > 0 && (
              <div className={styles.pagesSection}>
                <h3 className={styles.sectionTitle}>Pages</h3>
                <div className={styles.tableContainer}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Page Name</th>
                        <th>URL</th>
                        <th>Saved On</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {state.saved_pages.map((page) => (
                        <tr key={page.id}>
                          <td>
                            <div className={styles.pageNameCell}>
                              <span className={styles.pageName}>
                                {page.name || 'Untitled Page'}
                              </span>
                            </div>
                          </td>
                          <td>
                            <div className={styles.urlCell}>
                              <a
                                href={page.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.urlLink}
                                aria-label="Open page in new tab"
                                title="Open page"
                              >
                                {page.url}
                              </a>
                              <a
                                href={page.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.sourceLink}
                                aria-label="Open page in new tab"
                                title="Open page"
                              >
                                <FiExternalLink />
                              </a>
                            </div>
                          </td>
                          <td>
                            <div className={styles.dateCell}>
                              {new Date(page.created_at).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </div>
                          </td>
                          <td>
                            <button
                              className={styles.deleteButton}
                              onClick={() => handleDeletePage(page.id)}
                              disabled={deletingPageId === page.id}
                              aria-label={`Delete page ${page.name || 'Untitled'}`}
                              title="Delete page"
                            >
                              <FiTrash2 />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {state.total > 0 && (
                  <div className={styles.pagination}>
                    <div className={styles.paginationInfo}>
                      Showing {startIndex}-{endIndex} of {state.total}
                    </div>
                    <div className={styles.paginationControls}>
                      <button
                        className={styles.paginationButton}
                        onClick={handlePrevious}
                        disabled={!canGoPrevious || state.isLoading}
                      >
                        Previous
                      </button>
                      <button
                        className={styles.paginationButton}
                        onClick={handleNext}
                        disabled={!canGoNext || state.isLoading}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Folder Modal */}
      <CreateFolderModal
        isOpen={isCreateFolderModalOpen}
        onClose={() => setIsCreateFolderModalOpen(false)}
        onCreate={handleCreateFolder}
        currentFolderName={currentFolderName}
      />

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title="Delete Folder"
        message={
          <>
            All pages and folders inside{' '}
            <span className={styles.folderNameHighlight}>
              {confirmDialog.folderName}
            </span>{' '}
            will be delete permanently. Are you sure ?
          </>
        }
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleConfirmDeleteFolder}
        onCancel={handleCancelDeleteFolder}
      />

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

MyPages.displayName = 'MyPages';
