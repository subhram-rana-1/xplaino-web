import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { FiMoreVertical, FiTrash2, FiFolder } from 'react-icons/fi';
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

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPopoverOpen(false);
    onDelete();
  };

  const handleMoveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPopoverOpen(false);
    if (onMove) {
      onMove();
    }
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
      {showMove && onMove && (
        <button
          className={styles.popoverButton}
          onClick={handleMoveClick}
          title="Move to folder"
          aria-label="Move to folder"
        >
          <FiFolder />
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
