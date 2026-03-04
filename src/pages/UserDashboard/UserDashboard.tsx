import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiRefreshCw, FiList, FiGrid, FiArrowUp, FiArrowDown, FiPlus, FiCheck, FiCornerDownLeft, FiBookOpen } from 'react-icons/fi';
import styles from './UserDashboard.module.css';
import { useAuth } from '@/shared/hooks/useAuth';
import {
  getAllFolders,
  createFolder,
  deleteFolder,
  renameFolder,
  shareFolder,
  unshareFolder,
  getFolderShareeList,
  getSharedFolders,
} from '@/shared/services/folders.service';
import { getSharedPdfs } from '@/shared/services/pdf.service';
import type { FolderWithSubFolders, SharedFolderItem, ShareeItem } from '@/shared/types/folders.types';
import type { SharedPdfItem } from '@/shared/types/pdf.types';
import { FolderIcon } from '@/shared/components/FolderIcon';
import { Toast } from '@/shared/components/Toast';
import { CreateFolderModal } from '@/shared/components/CreateFolderModal';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { DataTable } from '@/shared/components/DataTable';
import { FolderMenu } from '@/shared/components/FolderMenu';
import { ShareModal } from '@/shared/components/ShareModal';
import { ShareeListModal } from '@/shared/components/ShareeListModal';

/**
 * UserDashboard - User dashboard with folder management and shared-with-me sections
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

  // Share folder state
  const [shareFolderId, setShareFolderId] = useState<string | null>(null);
  const [shareFolderName, setShareFolderName] = useState<string>('');

  // Manage sharing (sharee list) state
  const [manageSharingFolderId, setManageSharingFolderId] = useState<string | null>(null);
  const [manageSharingFolderName, setManageSharingFolderName] = useState<string>('');
  const [shareeList, setShareeList] = useState<ShareeItem[]>([]);
  const [isShareeListLoading, setIsShareeListLoading] = useState(false);

  // Shared-with-me state
  const [sharedFolders, setSharedFolders] = useState<SharedFolderItem[]>([]);
  const [sharedPdfs, setSharedPdfs] = useState<SharedPdfItem[]>([]);
  const [isSharedLoading, setIsSharedLoading] = useState(false);

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

  const fetchSharedData = async () => {
    if (!accessToken) return;

    try {
      setIsSharedLoading(true);
      const [foldersRes, pdfsRes] = await Promise.all([
        getSharedFolders(accessToken),
        getSharedPdfs(accessToken),
      ]);
      setSharedFolders(foldersRes.folders);
      setSharedPdfs(pdfsRes.pdfs);
    } catch (error) {
      console.error('Error fetching shared data:', error);
    } finally {
      setIsSharedLoading(false);
    }
  };

  useEffect(() => {
    if (accessToken) {
      fetchFolders();
      fetchSharedData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  const handleRefresh = () => {
    fetchFolders(true);
    fetchSharedData();
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
    navigate(`/user/dashboard/folder/${folder.id}`, {
      state: { folder: { id: folder.id, name: folder.name } }
    });
  };

  const handleSharedFolderClick = (folder: SharedFolderItem) => {
    navigate(`/user/dashboard/folder/${folder.id}`, {
      state: { folder: { id: folder.id, name: folder.name } }
    });
  };

  const handleCreateFolder = async (name: string) => {
    if (!accessToken) {
      throw new Error('Not authenticated');
    }

    try {
      await createFolder(accessToken, name);
      await fetchFolders();
      setToast({ message: 'Folder created successfully!', type: 'success' });
      setIsCreateModalOpen(false);
    } catch (error) {
      console.error('Error creating folder:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create folder';
      setToast({ message: errorMessage, type: 'error' });
      throw error;
    }
  };

  const handleDeleteClick = (folderId: string) => {
    setDeleteConfirmFolderId(folderId);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmFolderId || !accessToken) return;

    try {
      await deleteFolder(accessToken, deleteConfirmFolderId);

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

      const updateFolderName = (folderList: FolderWithSubFolders[], id: string, newName: string): FolderWithSubFolders[] => {
        return folderList.map(folder => {
          if (folder.id === id) {
            return { ...folder, name: newName };
          }
          if (folder.subFolders && folder.subFolders.length > 0) {
            return { ...folder, subFolders: updateFolderName(folder.subFolders, id, newName) };
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

  // --- Share handlers ---
  const handleShareClick = async (folderId: string, folderName: string) => {
    setShareFolderId(folderId);
    setShareFolderName(folderName);
    // Load sharees in the background so the inline section is populated
    if (!accessToken) return;
    setIsShareeListLoading(true);
    try {
      const res = await getFolderShareeList(accessToken, folderId);
      setShareeList(res.sharees);
    } catch {
      setShareeList([]);
    } finally {
      setIsShareeListLoading(false);
    }
  };

  const handleShareSubmit = async (email: string) => {
    if (!accessToken || !shareFolderId) return;
    await shareFolder(accessToken, shareFolderId, email);
  };

  const handleManageSharingClick = async (folderId: string, folderName: string) => {
    if (!accessToken) return;
    setManageSharingFolderId(folderId);
    setManageSharingFolderName(folderName);
    setIsShareeListLoading(true);
    try {
      const res = await getFolderShareeList(accessToken, folderId);
      setShareeList(res.sharees);
    } catch (error) {
      console.error('Error fetching sharee list:', error);
      setToast({ message: 'Failed to load sharing list', type: 'error' });
      setManageSharingFolderId(null);
    } finally {
      setIsShareeListLoading(false);
    }
  };

  const handleUnshare = async (email: string) => {
    // Works for both the share modal (shareFolderId) and manage-sharing modal (manageSharingFolderId)
    const folderId = manageSharingFolderId || shareFolderId;
    if (!accessToken || !folderId) return;
    await unshareFolder(accessToken, folderId, email);
    setShareeList(prev => prev.filter(s => s.email !== email));
    setToast({ message: `Removed access for ${email}`, type: 'success' });
  };

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
      {/* My Folders */}
      <h2 className={styles.heading}>My Folders</h2>
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
              title="Refresh"
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
              <span>Create Folder</span>
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
                      header: 'Name',
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
                      header: 'Created On',
                      align: 'left',
                      headerRender: () => (
                        <button
                          className={`${styles.sortButton} ${sortBy === 'created_at' ? styles.sortButtonActive : ''}`}
                          onClick={() => handleSort('created_at')}
                        >
                          Created On
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
                            onShare={() => handleShareClick(folder.id, folder.name)}
                            onManageSharing={() => handleManageSharingClick(folder.id, folder.name)}
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
                    onClick={() => { if (editingFolderId !== folder.id) handleFolderClick(folder); }}
                    onMouseEnter={() => setHoveredRowId(folder.id)}
                    onMouseLeave={() => setHoveredRowId(null)}
                  >
                    <div
                      className={styles.folderCardActions}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <FolderMenu
                        onRename={() => handleRenameClick(folder.id, folder.name)}
                        onDelete={() => handleDeleteClick(folder.id)}
                        onShare={() => handleShareClick(folder.id, folder.name)}
                        onManageSharing={() => handleManageSharingClick(folder.id, folder.name)}
                        isVisible={hoveredRowId === folder.id}
                      />
                    </div>
                    <FolderIcon size={32} />
                    {editingFolderId === folder.id ? (
                      <div className={styles.folderCardEditWrapper} onClick={(e) => e.stopPropagation()}>
                        <input
                          ref={editInputRef}
                          type="text"
                          value={editingFolderName}
                          onChange={(e) => setEditingFolderName(e.target.value)}
                          onKeyDown={(e) => handleFolderNameKeyDown(e, folder.id)}
                          onBlur={() => handleRenameSubmit(folder.id)}
                          className={styles.folderCardNameInput}
                          maxLength={50}
                        />
                        <button
                          className={styles.folderCardConfirmButton}
                          onMouseDown={(e) => { e.preventDefault(); handleRenameSubmit(folder.id); }}
                          title="Confirm rename"
                          aria-label="Confirm rename"
                          tabIndex={-1}
                        >
                          <FiCornerDownLeft size={14} />
                        </button>
                      </div>
                    ) : (
                      <span className={styles.folderCardName}>{folder.name}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Shared Folders Section */}
        {(sharedFolders.length > 0 || isSharedLoading) && (
          <div className={styles.sharedSection}>
            <h2 className={styles.sharedHeading}>Shared Folders</h2>
            {isSharedLoading ? (
              <div className={styles.sharedLoading}>Loading shared folders...</div>
            ) : (
              <div className={styles.sharedFolderGrid}>
                {sharedFolders.map((folder) => (
                  <div
                    key={folder.id}
                    className={styles.sharedFolderCard}
                    onClick={() => handleSharedFolderClick(folder)}
                    title={`Shared folder: ${folder.name}`}
                  >
                    <FolderIcon size={28} />
                    <span className={styles.sharedFolderCardName}>{folder.name}</span>
                    <span className={styles.sharedFolderCardDate}>
                      Shared {new Date(folder.shared_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Shared PDFs Section */}
        {(sharedPdfs.length > 0 || isSharedLoading) && (
          <div className={styles.sharedSection}>
            <h2 className={styles.sharedHeading}>Shared PDFs</h2>
            {isSharedLoading ? (
              <div className={styles.sharedLoading}>Loading shared PDFs...</div>
            ) : (
              <div className={styles.sharedPdfList}>
                {sharedPdfs.map((pdf) => (
                  <div
                    key={pdf.id}
                    className={styles.sharedPdfRow}
                  >
                    <div className={styles.sharedPdfInfo}>
                      <span className={styles.sharedPdfName}>{pdf.file_name}</span>
                      <span className={styles.sharedPdfDate}>
                        Shared {new Date(pdf.shared_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                    <button
                      className={styles.sharedPdfViewButton}
                      onClick={() => window.open(`${window.location.origin}/pdf/${pdf.id}`, '_blank', 'noopener,noreferrer')}
                      title="View PDF"
                      aria-label="View PDF"
                    >
                      <FiBookOpen size={15} />
                      <span>View</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
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

        {/* Share Folder Modal */}
        <ShareModal
          isOpen={!!shareFolderId}
          onClose={() => { setShareFolderId(null); setShareFolderName(''); setShareeList([]); }}
          onShare={handleShareSubmit}
          title={`Share "${shareFolderName}"`}
          sharees={shareeList}
          isLoadingSharees={isShareeListLoading}
          onUnshare={handleUnshare}
        />

        {/* Manage Sharing (Sharee List) Modal */}
        <ShareeListModal
          isOpen={!!manageSharingFolderId}
          onClose={() => { setManageSharingFolderId(null); setManageSharingFolderName(''); setShareeList([]); }}
          title={`Sharing: "${manageSharingFolderName}"`}
          sharees={shareeList}
          isLoading={isShareeListLoading}
          onUnshare={handleUnshare}
        />
    </div>
  );
};

UserDashboard.displayName = 'UserDashboard';
