import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { FiMoreVertical, FiTrash2 } from 'react-icons/fi';
import styles from './ActionMenu.module.css';

export interface ActionMenuProps {
  onDelete: () => void;
  onMove?: () => void;
  isVisible: boolean;
  className?: string;
  showMove?: boolean;
}

/**
 * ActionMenu - 3-dot menu with popover for table row actions
 * Shows a grey 3-dot icon that reveals a popover with Delete and Move to folder options (text labels)
 * 
 * @param onDelete - Function to call when Delete is clicked
 * @param onMove - Function to call when Move to folder is clicked
 * @param isVisible - Whether the menu should be visible (on hover)
 * @param className - Additional CSS class
 * @param showMove - Whether to show the Move to folder option (default true)
 * @returns JSX element
 */
export const ActionMenu: React.FC<ActionMenuProps> = ({
  onDelete,
  onMove,
  isVisible,
  className = '',
  showMove = true,
}) => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [isPopoverClosing, setIsPopoverClosing] = useState(false);
  const [popoverPosition, setPopoverPosition] = useState<{ top: number; right: number } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Calculate popover position
  useEffect(() => {
    if (isPopoverOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const viewportTop = window.scrollY;
      const viewportBottom = window.scrollY + window.innerHeight;
      const offset = 0.5 * 16; // 0.5rem in pixels
      const estimatedHeight = showMove && onMove ? 96 : 64;

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
  }, [isPopoverOpen, onMove, showMove]);

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        menuRef.current &&
        !menuRef.current.contains(target) &&
        buttonRef.current &&
        !buttonRef.current.contains(target) &&
        popoverRef.current &&
        !popoverRef.current.contains(target)
      ) {
        handleClosePopover();
      }
    };

    if (isPopoverOpen && !isPopoverClosing) {
      // Use a small delay to ensure button clicks are processed first
      const timeoutId = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside, true);
      }, 10);

      return () => {
        clearTimeout(timeoutId);
        document.removeEventListener('mousedown', handleClickOutside, true);
      };
    }
  }, [isPopoverOpen, isPopoverClosing]);

  const handleClosePopover = () => {
    if (isPopoverOpen && !isPopoverClosing) {
      setIsPopoverClosing(true);
      setTimeout(() => {
        setIsPopoverOpen(false);
        setIsPopoverClosing(false);
        setPopoverPosition(null);
      }, 200); // Match animation duration
    }
  };

  // Close popover on scroll
  useEffect(() => {
    if (isPopoverOpen) {
      const handleScroll = () => {
        handleClosePopover();
      };
      window.addEventListener('scroll', handleScroll, true);
      return () => {
        window.removeEventListener('scroll', handleScroll, true);
      };
    }
  }, [isPopoverOpen, isPopoverClosing]);

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPopoverOpen) {
      handleClosePopover();
    } else {
      setIsPopoverOpen(true);
      setIsPopoverClosing(false);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onDelete();
    handleClosePopover();
  };

  const handleMoveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (onMove) {
      onMove();
    }
    handleClosePopover();
  };

  const popoverContent = (isPopoverOpen || isPopoverClosing) && popoverPosition ? (
    <div
      ref={popoverRef}
      className={`${styles.popover} ${isPopoverOpen && !isPopoverClosing ? styles.popoverOpen : ''} ${isPopoverClosing ? styles.popoverClosing : ''}`}
      style={{
        position: 'fixed',
        top: `${popoverPosition.top}px`,
        right: `${popoverPosition.right}px`,
      }}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      {showMove && onMove && (
        <button
          className={`${styles.popoverButton} ${styles.popoverButtonMove}`}
          onClick={handleMoveClick}
          onMouseDown={(e) => e.preventDefault()}
          title="Move to folder"
          aria-label="Move to folder"
        >
          <svg
            className={styles.folderArrowIcon}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
          >
            <path
              d="M4 5C4 3.89543 4.89543 3 6 3H9.17157C9.70201 3 10.2107 3.21071 10.5858 3.58579L12.4142 5.41421C12.7893 5.78929 13.298 6 13.8284 6H18C19.1046 6 20 6.89543 20 8V19C20 20.1046 19.1046 21 18 21H6C4.89543 21 4 20.1046 4 19V5Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M9 12H15M15 12L13 10M15 12L13 14"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span>Move to folder</span>
        </button>
      )}
      <button
        className={`${styles.popoverButton} ${styles.popoverButtonDelete}`}
        onClick={handleDeleteClick}
        title="Delete"
        aria-label="Delete"
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
        className={`${styles.actionMenu} ${isVisible ? styles.visible : styles.hidden} ${className}`}
      >
        <button
          ref={buttonRef}
          className={styles.menuButton}
          onClick={handleMenuClick}
          title="Actions"
          aria-label="Actions"
        >
          <FiMoreVertical />
        </button>
      </div>
      {popoverContent && createPortal(popoverContent, document.body)}
    </>
  );
};

ActionMenu.displayName = 'ActionMenu';
