import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiRefreshCw, FiList, FiGrid, FiArrowUp, FiArrowDown, FiPlus, FiCheck } from 'react-icons/fi';
import styles from './UserDashboard.module.css';
import { useAuth } from '@/shared/hooks/useAuth';
import { getAllFolders, createFolder, deleteFolder, renameFolder } from '@/shared/services/folders.service';
import type { FolderWithSubFolders } from '@/shared/types/folders.types';
import { FolderIcon } from '@/shared/components/FolderIcon';
import { Toast } from '@/shared/components/Toast';
import { CreateFolderModal } from '@/shared/components/CreateFolderModal';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { DataTable } from '@/shared/components/DataTable';
import { FolderMenu } from '@/shared/components/FolderMenu';
import { ActionIcons } from '@/shared/components/ActionIcons';

/**
 * UserDashboard - User dashboard with folder management
 * 
 * @returns JSX element
 */
export const UserDashboard: React.FC = () => {
  const { accessToken } = useAuth();
  const [folders, setFolders] = useState<FolderWithSubFolders[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
  const [sortBy, setSortBy] = useState<'created_at' | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [toast, setToast] = useState<{ message: string; type?: 'success' | 'error' } | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [deleteConfirmFolderId, setDeleteConfirmFolderId] = useState<string | null>(null);
  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null);
  const [showRefreshSuccess, setShowRefreshSuccess] = useState(false);
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingFolderName, setEditingFolderName] = useState<string>('');
  const editInputRef = useRef<HTMLInputElement>(null);

  // Flatten hierarchical folder structure
  const flattenFolders = (folderList: FolderWithSubFolders[]): FolderWithSubFolders[] => {
    const result: FolderWithSubFolders[] = [];
    const traverse = (folder: FolderWithSubFolders) => {
      result.push(folder);
      if (folder.subFolders && folder.subFolders.length > 0) {
        folder.subFolders.forEach(traverse);
      }
    };
    folderList.forEach(traverse);
    return result;
  };

  const fetchFolders = async (showSuccessFeedback = false) => {
    if (!accessToken) return;

    try {
      setIsLoading(true);
      const response = await getAllFolders(accessToken);
      setFolders(response.folders);
      
      if (showSuccessFeedback) {
        setShowRefreshSuccess(true);
        setTimeout(() => {
          setShowRefreshSuccess(false);
        }, 2000);
      }
    } catch (error) {
      console.error('Error fetching folders:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load folders';
      setToast({ message: errorMessage, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (accessToken) {
      fetchFolders();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  const handleRefresh = () => {
    fetchFolders(true);
  };

  const handleSort = (field: 'created_at') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handleFolderClick = (folder: FolderWithSubFolders) => {
    navigate(`/user/dashboard/bookmark/${folder.id}`, {
      state: { folder: { id: folder.id, name: folder.name } }
    });
  };

  const handleCreateFolder = async (name: string) => {
    if (!accessToken) {
      throw new Error('Not authenticated');
    }

    try {
      await createFolder(accessToken, name);
      // Refresh folders list to show the newly created folder
      await fetchFolders();
      setToast({ message: 'Folder created successfully!', type: 'success' });
      setIsCreateModalOpen(false);
    } catch (error) {
      console.error('Error creating folder:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create folder';
      setToast({ message: errorMessage, type: 'error' });
      throw error; // Re-throw to let modal handle it
    }
  };

  const handleDeleteClick = (folderId: string) => {
    setDeleteConfirmFolderId(folderId);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmFolderId || !accessToken) return;

    try {
      await deleteFolder(accessToken, deleteConfirmFolderId);
      
      // Remove folder from state (handle nested structure)
      const removeFolderById = (folderList: FolderWithSubFolders[], id: string): FolderWithSubFolders[] => {
        return folderList
          .filter(folder => folder.id !== id)
          .map(folder => ({
            ...folder,
            subFolders: removeFolderById(folder.subFolders || [], id)
          }));
      };
      
      setFolders(prevFolders => removeFolderById(prevFolders, deleteConfirmFolderId));
      setToast({ message: 'Folder deleted successfully', type: 'success' });
      setDeleteConfirmFolderId(null);
    } catch (error) {
      console.error('Error deleting folder:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete folder';
      setToast({ message: errorMessage, type: 'error' });
      // Close the confirmation modal on error
      setDeleteConfirmFolderId(null);
    }
  };

  const handleRenameClick = (folderId: string, currentName: string) => {
    setEditingFolderId(folderId);
    setEditingFolderName(currentName);
  };

  const handleRenameSubmit = async (folderId: string) => {
    if (!accessToken || !editingFolderName.trim()) {
      setEditingFolderId(null);
      setEditingFolderName('');
      return;
    }

    try {
      const updatedFolder = await renameFolder(accessToken, folderId, editingFolderName.trim());
      
      // Update folder name in state (handle nested structure)
      const updateFolderName = (folderList: FolderWithSubFolders[], id: string, newName: string): FolderWithSubFolders[] => {
        return folderList.map(folder => {
          if (folder.id === id) {
            return {
              ...folder,
              name: newName,
            };
          }
          if (folder.subFolders && folder.subFolders.length > 0) {
            return {
              ...folder,
              subFolders: updateFolderName(folder.subFolders, id, newName),
            };
          }
          return folder;
        });
      };
      
      setFolders(prevFolders => updateFolderName(prevFolders, folderId, updatedFolder.name));
      setToast({ message: 'Folder renamed successfully', type: 'success' });
      setEditingFolderId(null);
      setEditingFolderName('');
    } catch (error) {
      console.error('Error renaming folder:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to rename folder';
      setToast({ message: errorMessage, type: 'error' });
    }
  };

  const handleRenameCancel = () => {
    setEditingFolderId(null);
    setEditingFolderName('');
  };

  // Auto-focus and select text when editing starts
  useEffect(() => {
    if (editingFolderId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingFolderId]);

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  // Get flattened and sorted folders
  const flattenedFolders = flattenFolders(folders);
  const sortedFolders = [...flattenedFolders].sort((a, b) => {
    if (!sortBy) return 0;
    const aValue = new Date(a[sortBy]).getTime();
    const bValue = new Date(b[sortBy]).getTime();
    return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
  });

  const handleFolderNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, folderId: string) => {
    if (e.key === 'Enter') {
      handleRenameSubmit(folderId);
    } else if (e.key === 'Escape') {
      handleRenameCancel();
    }
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>My bookmarks</h2>
      <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.viewToggle}>
              <button
                className={`${styles.viewButton} ${viewMode === 'grid' ? styles.viewButtonActive : ''}`}
                onClick={() => setViewMode('grid')}
                title="Grid view"
              >
                <FiGrid />
              </button>
              <button
                className={`${styles.viewButton} ${viewMode === 'list' ? styles.viewButtonActive : ''}`}
                onClick={() => setViewMode('list')}
                title="List view"
              >
                <FiList />
              </button>
            </div>
          </div>
          <div className={styles.headerRight}>
            <button
              className={`${styles.refreshButton} ${showRefreshSuccess ? styles.refreshButtonSuccess : ''}`}
              onClick={handleRefresh}
              disabled={isLoading}
              title="Refresh folders"
            >
              {showRefreshSuccess ? (
                <>
                  <FiCheck />
                  <span>Data fetched</span>
                </>
              ) : (
                <>
                  <FiRefreshCw className={isLoading ? styles.spin : ''} />
                  <span>Refresh</span>
                </>
              )}
            </button>
            <button
              className={styles.createFolderButton}
              onClick={() => setIsCreateModalOpen(true)}
              title="Create folder"
            >
              <FiPlus />
              <span>Create folder</span>
            </button>
          </div>
        </div>

        {isLoading && folders.length === 0 ? (
          <div className={styles.loading}>Loading folders...</div>
        ) : sortedFolders.length === 0 ? (
          <div className={styles.emptyState}>
            <h2 className={styles.emptyHeading}>No folders yet</h2>
            <p className={styles.emptyMessage}>You haven't created any folders yet.</p>
          </div>
        ) : (
          <>
            {viewMode === 'list' ? (
              <div className={styles.listViewWrapper}>
                <div className={styles.listView}>
                  <DataTable
                  columns={[
                    {
                      key: 'name',
                      header: 'Folder Name',
                      align: 'left',
                      render: (folder) => {
                        const isEditing = editingFolderId === folder.id;
                        return (
                          <div 
                            className={styles.folderNameCell}
                            onClick={!isEditing ? () => handleFolderClick(folder) : undefined}
                            style={!isEditing ? { cursor: 'pointer' } : undefined}
                          >
                            <FolderIcon size={20} />
                            {isEditing ? (
                              <input
                                ref={editInputRef}
                                type="text"
                                value={editingFolderName}
                                onChange={(e) => setEditingFolderName(e.target.value)}
                                onKeyDown={(e) => handleFolderNameKeyDown(e, folder.id)}
                                onBlur={() => handleRenameSubmit(folder.id)}
                                onClick={(e) => e.stopPropagation()}
                                className={styles.folderNameInput}
                                maxLength={50}
                              />
                            ) : (
                              <span>{folder.name}</span>
                            )}
                          </div>
                        );
                      },
                    },
                    {
                      key: 'created_at',
                      header: 'Created At',
                      align: 'left',
                      headerRender: () => (
                        <button
                          className={`${styles.sortButton} ${sortBy === 'created_at' ? styles.sortButtonActive : ''}`}
                          onClick={() => handleSort('created_at')}
                        >
                          Created At
                          <span className={styles.sortIcons}>
                            <FiArrowUp className={sortBy === 'created_at' && sortOrder === 'asc' ? styles.sortIconActive : styles.sortIconInactive} />
                            <FiArrowDown className={sortBy === 'created_at' && sortOrder === 'desc' ? styles.sortIconActive : styles.sortIconInactive} />
                          </span>
                        </button>
                      ),
                      render: (folder) => formatDate(folder.created_at),
                    },
                    {
                      key: 'actions',
                      header: '',
                      align: 'right',
                      render: (folder) => {
                        const isHovered = hoveredRowId === folder.id;
                        return (
                          <FolderMenu
                            onRename={() => handleRenameClick(folder.id, folder.name)}
                            onDelete={() => handleDeleteClick(folder.id)}
                            isVisible={isHovered}
                            className={styles.actionIconsInCell}
                          />
                        );
                      },
                    },
                  ]}
                  data={sortedFolders}
                  emptyMessage="No folders found"
                  rowKey={(folder) => folder.id}
                  onRowHover={(folder) => {
                    if (folder) {
                      setHoveredRowId(folder.id);
                    } else {
                      setHoveredRowId(null);
                    }
                  }}
                />
                </div>
              </div>
            ) : (
              <div className={styles.gridView}>
                {sortedFolders.map((folder) => (
                  <div
                    key={folder.id}
                    className={styles.folderCard}
                    onClick={() => handleFolderClick(folder)}
                    onMouseEnter={() => setHoveredRowId(folder.id)}
                    onMouseLeave={() => setHoveredRowId(null)}
                  >
                    {hoveredRowId === folder.id && (
                      <div 
                        className={styles.folderCardActions}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ActionIcons
                          onDelete={() => handleDeleteClick(folder.id)}
                          onMove={() => {}}
                          isVisible={true}
                          showMove={false}
                        />
                      </div>
                    )}
                    <FolderIcon size={32} />
                    <span className={styles.folderCardName}>{folder.name}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
        <CreateFolderModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onCreate={handleCreateFolder}
        />
        {deleteConfirmFolderId && (
          <ConfirmDialog
            isOpen={true}
            title="Confirm Delete"
            message="All the words, paragraphs, images and links will be auto deleted. Are you sure?"
            confirmText="I understand, delete folder"
            cancelText="Cancel"
            onConfirm={handleDeleteConfirm}
            onCancel={() => setDeleteConfirmFolderId(null)}
          />
        )}
    </div>
  );
};

UserDashboard.displayName = 'UserDashboard';

