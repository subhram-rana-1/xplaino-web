import React, { useState, useEffect } from 'react';
import { FiX, FiFolder, FiFolderPlus, FiCheck, FiCopy, FiCornerDownLeft } from 'react-icons/fi';
import type { FolderWithSubFolders } from '@/shared/types/folders.types';
import { createFolder } from '@/shared/services/folders.service';
import { createPdfCopy } from '@/shared/services/pdf.service';
import styles from './CopyPdfModal.module.css';

interface CopyPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  pdfId: string;
  folders: FolderWithSubFolders[];
  accessToken: string;
  onCopied: (newPdfId: string) => void;
}

/** Flatten a nested folder tree into a flat list for display */
function flattenFolders(folders: FolderWithSubFolders[], depth = 0): Array<{ folder: FolderWithSubFolders; depth: number }> {
  const result: Array<{ folder: FolderWithSubFolders; depth: number }> = [];
  for (const f of folders) {
    result.push({ folder: f, depth });
    if (f.subFolders?.length) {
      result.push(...flattenFolders(f.subFolders, depth + 1));
    }
  }
  return result;
}

export const CopyPdfModal: React.FC<CopyPdfModalProps> = ({
  isOpen,
  onClose,
  pdfId,
  folders,
  accessToken,
  onCopied,
}) => {
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isClosing, setIsClosing] = useState(false);

  const flatFolders = flattenFolders(folders);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedFolderId(null);
      setNewFolderName('');
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen && !isClosing) return null;

  const handleClose = () => {
    if (isLoading) return;
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 300);
  };

  const handleFolderSelect = (id: string | null) => {
    setSelectedFolderId(id);
    setNewFolderName('');
  };

  const handleMakeCopy = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setError(null);

    try {
      let folderId: string | undefined;

      if (newFolderName.trim()) {
        const created = await createFolder(accessToken, newFolderName.trim());
        folderId = created.id;
      } else if (selectedFolderId) {
        folderId = selectedFolderId;
      }

      const newPdf = await createPdfCopy(accessToken, pdfId, folderId);
      onCopied(newPdf.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create copy');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={`${styles.overlay} ${isClosing ? styles.closing : ''}`}
      onClick={handleClose}
    >
      <div
        className={`${styles.modal} ${isClosing ? styles.closing : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerIcon}>
            <FiCopy size={18} />
          </div>
          <div className={styles.headerText}>
            <h2 className={styles.title}>Can't annotate a public PDF</h2>
            <p className={styles.subtitle}>
              Make a private copy to highlight, add notes, and make it fully yours.
            </p>
          </div>
          <button
            type="button"
            className={styles.closeButton}
            onClick={handleClose}
            disabled={isLoading}
            aria-label="Close"
          >
            <FiX />
          </button>
        </div>

        {/* Folder picker */}
        <div className={styles.body}>
          <p className={styles.sectionLabel}>Save copy to</p>

          <ul className={styles.folderList}>
            {/* Existing folders */}
            {flatFolders.map(({ folder, depth }) => (
              <li key={folder.id}>
                <button
                  type="button"
                  className={`${styles.folderRow} ${selectedFolderId === folder.id && !newFolderName ? styles.folderRowSelected : ''}`}
                  style={{ paddingLeft: `${1 + depth * 1}rem` }}
                  onClick={() => handleFolderSelect(folder.id)}
                >
                  <FiFolder size={15} className={styles.folderIcon} />
                  <span className={styles.folderName}>{folder.name}</span>
                  {selectedFolderId === folder.id && !newFolderName && (
                    <FiCheck size={14} className={styles.checkIcon} />
                  )}
                </button>
              </li>
            ))}
          </ul>

          {/* Create new folder */}
          <div className={styles.newFolderSection}>
            <FiFolderPlus size={15} className={styles.newFolderIcon} />
            <input
              type="text"
              className={styles.newFolderInput}
              placeholder="Create new folder…"
              value={newFolderName}
              onChange={(e) => {
                setNewFolderName(e.target.value);
                if (e.target.value) setSelectedFolderId(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newFolderName.trim() && !isLoading) {
                  handleMakeCopy();
                }
              }}
              disabled={isLoading}
            />
            {newFolderName.trim() && (
              <span className={styles.enterHint}>
                <FiCornerDownLeft size={11} />
                <span>Enter</span>
              </span>
            )}
          </div>

          {error && <div className={styles.errorMessage}>{error}</div>}
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <button
            type="button"
            className={styles.copyButton}
            onClick={handleMakeCopy}
            disabled={isLoading || (!selectedFolderId && !newFolderName.trim())}
          >
            {isLoading ? (
              <span className={styles.spinner} aria-hidden="true" />
            ) : (
              <FiCopy size={14} />
            )}
            {isLoading ? 'Creating copy…' : 'Make a copy'}
          </button>
        </div>
      </div>
    </div>
  );
};

CopyPdfModal.displayName = 'CopyPdfModal';
