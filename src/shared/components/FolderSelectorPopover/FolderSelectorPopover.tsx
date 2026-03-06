import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Folder } from 'lucide-react';
import type { FolderWithSubFolders } from '@/shared/types/folders.types';
import styles from './FolderSelectorPopover.module.css';

export interface FolderSelectorPopoverProps {
  folders: FolderWithSubFolders[];
  currentFolderId?: string;
  onSelect: (folder: FolderWithSubFolders) => void;
}

export const FolderSelectorPopover: React.FC<FolderSelectorPopoverProps> = ({
  folders,
  currentFolderId,
  onSelect,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [popoverPosition, setPopoverPosition] = useState<{ top: number; left: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const estimatedHeight = Math.min(folders.length * 44, 260);
      const spaceBelow = window.innerHeight - rect.bottom;

      let top: number;
      if (spaceBelow < estimatedHeight + 8 && rect.top > estimatedHeight + 8) {
        top = rect.top + window.scrollY - estimatedHeight - 4;
      } else {
        top = rect.bottom + window.scrollY + 4;
      }

      setPopoverPosition({ top, left: rect.left + window.scrollX });
    } else {
      setPopoverPosition(null);
    }
  }, [isOpen, folders.length]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node) &&
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleScroll = () => setIsOpen(false);
    window.addEventListener('scroll', handleScroll, true);
    return () => window.removeEventListener('scroll', handleScroll, true);
  }, [isOpen]);

  const handleSelect = (folder: FolderWithSubFolders) => {
    setIsOpen(false);
    onSelect(folder);
  };

  const popoverContent = isOpen && popoverPosition ? (
    <div
      ref={popoverRef}
      className={`${styles.popover} ${styles.popoverOpen}`}
      style={{ top: popoverPosition.top, left: popoverPosition.left }}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      {folders.length === 0 ? (
        <div className={styles.emptyMessage}>No folders</div>
      ) : (
        folders.map((folder) => (
          <button
            key={folder.id}
            className={`${styles.folderItem} ${folder.id === currentFolderId ? styles.folderItemActive : ''}`}
            onClick={() => handleSelect(folder)}
          >
            <Folder className={styles.folderIcon} />
            <span className={styles.folderName}>{folder.name}</span>
          </button>
        ))
      )}
    </div>
  ) : null;

  const currentFolder = folders.find((f) => f.id === currentFolderId);
  const displayName = currentFolder
    ? (currentFolder.name.length > 14 ? `${currentFolder.name.slice(0, 14)}...` : currentFolder.name)
    : 'Select Folder';

  return (
    <div className={styles.field}>
      <span className={styles.fieldLabel}>Folder</span>
      <button
        ref={buttonRef}
        className={styles.triggerButton}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <span className={styles.triggerValue}>{displayName}</span>
        <ChevronDown
          className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`}
        />
      </button>
      {popoverContent && createPortal(popoverContent, document.body)}
    </div>
  );
};

FolderSelectorPopover.displayName = 'FolderSelectorPopover';
