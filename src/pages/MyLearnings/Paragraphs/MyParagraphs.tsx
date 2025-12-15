import React, { useEffect, useState } from 'react';
import { FiArrowLeft, FiTrash2, FiExternalLink, FiFolderPlus } from 'react-icons/fi';
import styles from './MyParagraphs.module.css';
import { useAuth } from '@/shared/hooks/useAuth';
import { LoginModal } from '@/shared/components/LoginModal';
import { useMyParagraphs } from '@/shared/hooks/useMyParagraphs';
import { FolderIcon } from '@/shared/components/FolderIcon';
import { CreateFolderModal } from '@/shared/components/CreateFolderModal';
import { ChromeButton } from '@/shared/components/ChromeButton';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { Toast } from '@/shared/components/Toast';

/**
 * MyParagraphs - My Paragraphs page component
 * 
 * @returns JSX element
 */
export const MyParagraphs: React.FC = () => {
  const { isLoggedIn, accessToken } = useAuth();
  const {
    state,
    fetchParagraphs,
    deleteParagraph,
    deleteFolder,
    createFolder,
    navigateToFolder,
    navigateToParent,
  } = useMyParagraphs();
  const [deletingParagraphId, setDeletingParagraphId] = useState<string | null>(null);
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
      fetchParagraphs(null, 0, 20, accessToken).catch((error) => {
        console.error('Error fetching paragraphs:', error);
      });
    }
  }, [isLoggedIn, accessToken, state.isLoaded, state.isLoading, fetchParagraphs]);

  // Refetch if offset changed and we need new data
  useEffect(() => {
    if (isLoggedIn && accessToken && state.isLoaded && !state.isLoading) {
      const needsRefetch = state.saved_paragraphs.length === 0 && state.offset > 0 && state.total > 0;
      if (needsRefetch) {
        fetchParagraphs(state.folder_id, state.offset, state.limit, accessToken).catch((error) => {
          console.error('Error fetching paragraphs:', error);
        });
      }
    }
  }, [state.offset, isLoggedIn, accessToken, state.isLoaded, state.isLoading, state.saved_paragraphs.length, state.total, state.folder_id, fetchParagraphs]);

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

  const handleDeleteParagraph = async (paragraphId: string) => {
    if (!accessToken) return;

    try {
      setDeletingParagraphId(paragraphId);
      await deleteParagraph(paragraphId, accessToken);
      setToast({ message: 'Paragraph deleted successfully' });
      // If we deleted and need to refetch, it will be handled by the hook
      if (state.saved_paragraphs.length === 0 && state.offset > 0) {
        await fetchParagraphs(state.folder_id, state.offset, state.limit, accessToken);
      }
    } catch (error) {
      console.error('Error deleting paragraph:', error);
    } finally {
      setDeletingParagraphId(null);
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

  const getFirst7Words = (content: string): string => {
    const words = content.trim().split(/\s+/);
    return words.slice(0, 7).join(' ');
  };

  const handleSourceLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, sourceUrl: string, content: string) => {
    e.preventDefault();
    const first7Words = getFirst7Words(content);
    const encodedContent = encodeURIComponent(first7Words);
    
    try {
      // Try to create a URL object (works for absolute URLs)
      const url = new URL(sourceUrl);
      url.searchParams.set('xlpaino_content', encodedContent);
      window.open(url.toString(), '_blank', 'noopener,noreferrer');
    } catch {
      // If it's a relative URL, append the query parameter manually
      const separator = sourceUrl.includes('?') ? '&' : '?';
      const urlWithParam = `${sourceUrl}${separator}xlpaino_content=${encodedContent}`;
      window.open(urlWithParam, '_blank', 'noopener,noreferrer');
    }
  };

  const handlePrevious = () => {
    if (state.offset > 0 && accessToken) {
      const newOffset = Math.max(0, state.offset - state.limit);
      fetchParagraphs(state.folder_id, newOffset, state.limit, accessToken).catch((error) => {
        console.error('Error fetching paragraphs:', error);
      });
    }
  };

  const handleNext = () => {
    if (state.has_next && accessToken) {
      const newOffset = state.offset + state.limit;
      fetchParagraphs(state.folder_id, newOffset, state.limit, accessToken).catch((error) => {
        console.error('Error fetching paragraphs:', error);
      });
    }
  };

  if (!isLoggedIn) {
    return (
      <div className={styles.myParagraphs}>
        <LoginModal actionText="view your saved paragraphs" />
      </div>
    );
  }

  const hasParent = state.currentFolderPath.length > 0;
  const currentFolderName = state.currentFolderPath.length > 0
    ? state.currentFolderPath[state.currentFolderPath.length - 1].name
    : undefined;
  const isEmpty = state.sub_folders.length === 0 && state.saved_paragraphs.length === 0 && !state.isLoading;
  const startIndex = state.offset + 1;
  const endIndex = Math.min(state.offset + state.limit, state.total);
  const canGoPrevious = state.offset > 0;
  const canGoNext = state.has_next;

  return (
    <div className={styles.myParagraphs}>
      <div className={styles.container}>
        <h1 className={styles.heading}>My Paragraphs</h1>
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
                            // Navigate to this folder by going back to its parent, then forward
                            const navigateToTargetFolder = async () => {
                              const targetIndex = index;
                              const currentDepth = state.currentFolderPath.length;
                              const targetDepth = targetIndex + 1;
                              
                              // Calculate how many levels to go back
                              // If target is at depth 2 and we're at depth 3, go back 1 level to get to depth 2
                              const levelsToGoBack = currentDepth - targetDepth;
                              
                              // Go back to reach the target folder's depth
                              for (let i = 0; i < levelsToGoBack; i++) {
                                await navigateToParent(accessToken);
                                // Small delay for smooth animation
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
        {state.isLoading && state.sub_folders.length === 0 && state.saved_paragraphs.length === 0 ? (
          <div className={styles.loading}>Loading...</div>
        ) : isEmpty ? (
          /* Empty State */
          <div className={styles.emptyState}>
            <h2 className={styles.emptyHeading}>No saved paragraphs yet</h2>
            <p className={styles.emptyMessage}>
              Start gathering important content
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

            {/* Paragraphs Section */}
            {state.saved_paragraphs.length > 0 && (
              <div className={styles.paragraphsSection}>
                <h3 className={styles.sectionTitle}>Paragraphs</h3>
                <div className={styles.paragraphsList}>
                  {state.saved_paragraphs.map((paragraph) => (
                    <div key={paragraph.id} className={styles.paragraphItem}>
                      <div className={styles.paragraphContent}>
                        <div className={styles.paragraphHeader}>
                          <h4 className={styles.paragraphName}>
                            {paragraph.name || 'Untitled Paragraph'}
                          </h4>
                          <a
                            href={paragraph.source_url}
                            onClick={(e) => handleSourceLinkClick(e, paragraph.source_url, paragraph.content)}
                            className={styles.sourceLink}
                            aria-label="Open source in new tab"
                            title="Open source"
                          >
                            <FiExternalLink />
                          </a>
                        </div>
                        <p className={styles.paragraphText}>
                          {paragraph.content.length > 200
                            ? `${paragraph.content.substring(0, 200)}...`
                            : paragraph.content}
                        </p>
                      </div>
                      <button
                        className={styles.deleteButton}
                        onClick={() => handleDeleteParagraph(paragraph.id)}
                        disabled={deletingParagraphId === paragraph.id}
                        aria-label={`Delete paragraph ${paragraph.name || 'Untitled'}`}
                        title="Delete paragraph"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  ))}
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
            All paragraphs and folders inside{' '}
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

MyParagraphs.displayName = 'MyParagraphs';
