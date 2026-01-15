import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { FiMoreVertical, FiEdit2, FiTrash2 } from 'react-icons/fi';
import styles from './FolderMenu.module.css';

export interface FolderMenuProps {
  onRename: () => void;
  onDelete: () => void;
  isVisible: boolean;
  className?: string;
}

/**
 * FolderMenu - 3-dot menu with popover for folder actions
 * Shows a grey 3-dot icon that reveals a popover with Rename and Delete options
 * 
 * @param onRename - Function to call when Rename is clicked
 * @param onDelete - Function to call when Delete is clicked
 * @param isVisible - Whether the menu should be visible (on hover)
 * @param className - Additional CSS class
 * @returns JSX element
 */
export const FolderMenu: React.FC<FolderMenuProps> = ({
  onRename,
  onDelete,
  isVisible,
  className = '',
}) => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [popoverPosition, setPopoverPosition] = useState<{ top: number; right: number } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Calculate popover position
  useEffect(() => {
    if (isPopoverOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const viewportTop = window.scrollY;
      const viewportBottom = window.scrollY + window.innerHeight;
      const offset = 0.5 * 16; // 0.5rem in pixels
      const estimatedHeight = 96;

      let top = rect.bottom + window.scrollY + offset;

      // If popover would go beyond viewport bottom, show it above the button instead
      if (top + estimatedHeight > viewportBottom) {
        top = rect.top + window.scrollY - estimatedHeight - offset;

        // If still above viewport, clamp to top
        if (top < viewportTop + offset) {
          top = viewportTop + offset;
        }
      }

      const right = Math.max(0, window.innerWidth - rect.right + window.scrollX);

      setPopoverPosition({
        top,
        right,
      });
    } else {
      setPopoverPosition(null);
    }
  }, [isPopoverOpen]);

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsPopoverOpen(false);
      }
    };

    if (isPopoverOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isPopoverOpen]);

  // Close popover on scroll
  useEffect(() => {
    if (isPopoverOpen) {
      const handleScroll = () => {
        setIsPopoverOpen(false);
      };
      window.addEventListener('scroll', handleScroll, true);
      return () => {
        window.removeEventListener('scroll', handleScroll, true);
      };
    }
  }, [isPopoverOpen]);

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPopoverOpen(!isPopoverOpen);
  };

  const handleRenameClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPopoverOpen(false);
    onRename();
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPopoverOpen(false);
    onDelete();
  };

  const popoverContent = isPopoverOpen && popoverPosition ? (
    <div
      className={`${styles.popover} ${styles.popoverOpen}`}
      style={{
        position: 'fixed',
        top: `${popoverPosition.top}px`,
        right: `${popoverPosition.right}px`,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        className={styles.popoverButton}
        onClick={handleRenameClick}
        title="Rename folder"
        aria-label="Rename folder"
      >
        <FiEdit2 />
        <span>Rename</span>
      </button>
      <button
        className={`${styles.popoverButton} ${styles.popoverButtonDelete}`}
        onClick={handleDeleteClick}
        title="Delete folder"
        aria-label="Delete folder"
      >
        <FiTrash2 />
        <span>Delete</span>
      </button>
    </div>
  ) : null;

  return (
    <>
      <div 
        ref={menuRef}
        className={`${styles.folderMenu} ${isVisible ? styles.visible : styles.hidden} ${className}`}
      >
        <button
          ref={buttonRef}
          className={styles.menuButton}
          onClick={handleMenuClick}
          title="Folder options"
          aria-label="Folder options"
        >
          <FiMoreVertical />
        </button>
      </div>
      {popoverContent && createPortal(popoverContent, document.body)}
    </>
  );
};

FolderMenu.displayName = 'FolderMenu';
