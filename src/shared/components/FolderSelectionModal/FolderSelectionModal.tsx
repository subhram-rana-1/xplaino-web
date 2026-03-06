import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import styles from './FolderSelectionModal.module.css';
import type { FolderWithSubFolders } from '@/shared/types/folders.types';

export interface FolderSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (folderId: string | null) => void;
  folders: FolderWithSubFolders[];
  isLoading: boolean;
  currentFolderId?: string | null;
}

/**
 * Flatten hierarchical folder structure into a flat list
 */
const flattenFolders = (folders: FolderWithSubFolders[], prefix: string = ''): Array<{ id: string; name: string; displayName: string }> => {
  const result: Array<{ id: string; name: string; displayName: string }> = [];
  
  folders.forEach((folder) => {
    const displayName = prefix ? `${prefix} / ${folder.name}` : folder.name;
    result.push({
      id: folder.id,
      name: folder.name,
      displayName,
    });
    
    if (folder.subFolders && folder.subFolders.length > 0) {
      result.push(...flattenFolders(folder.subFolders, displayName));
    }
  });
  
  return result;
};

export const FolderSelectionModal: React.FC<FolderSelectionModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  folders,
  isLoading,
  currentFolderId,
}) => {
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsClosing(false);
      // Reset selection when modal opens (don't pre-select current folder since it's filtered out)
      setSelectedFolderId(null);
    }
  }, [isOpen]);

  if (!isOpen && !isClosing) return null;

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 300);
  };

  const handleSave = () => {
    if (selectedFolderId) {
      onSelect(selectedFolderId);
      handleClose();
    }
  };

  const flatFolders = flattenFolders(folders);
  // Filter out the current folder
  const filteredFolders = flatFolders.filter(
    (folder) => folder.id !== currentFolderId
  );

  return (
    <div 
      className={`${styles.overlay} ${isClosing ? styles.closing : ''}`}
      onClick={handleClose}
    >
      <div 
        className={`${styles.modal} ${isClosing ? styles.closing : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.header}>
          <h2 className={styles.title}>Select Folder</h2>
          <button
            className={styles.closeButton}
            onClick={handleClose}
            aria-label="Close"
          >
            <X />
          </button>
        </div>
        
        <div className={styles.content}>
          {isLoading ? (
            <div className={styles.loading}>Loading folders...</div>
          ) : filteredFolders.length === 0 ? (
            <div className={styles.empty}>No folders available</div>
          ) : (
            <div className={styles.folderList}>
              {filteredFolders.map((folder) => (
                <div
                  key={folder.id}
                  className={`${styles.folderItem} ${selectedFolderId === folder.id ? styles.selected : ''}`}
                  onClick={() => setSelectedFolderId(folder.id)}
                >
                  <svg
                    className={styles.folderIcon}
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M4 5C4 3.89543 4.89543 3 6 3H9.17157C9.70201 3 10.2107 3.21071 10.5858 3.58579L12.4142 5.41421C12.7893 5.78929 13.298 6 13.8284 6H18C19.1046 6 20 6.89543 20 8V19C20 20.1046 19.1046 21 18 21H6C4.89543 21 4 20.1046 4 19V5Z"
                      fill="currentColor"
                    />
                  </svg>
                  <div className={styles.folderName}>{folder.displayName}</div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className={styles.footer}>
          <button
            className={styles.cancelButton}
            onClick={handleClose}
          >
            Cancel
          </button>
          <button
            className={styles.saveButton}
            onClick={handleSave}
            disabled={isLoading || !selectedFolderId}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

FolderSelectionModal.displayName = 'FolderSelectionModal';

