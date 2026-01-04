import React from 'react';
import { FiTrash2, FiBook } from 'react-icons/fi';
import styles from './PdfActionIcons.module.css';

export interface PdfActionIconsProps {
  onDelete: () => void;
  onBook: () => void;
  isVisible: boolean;
  className?: string;
}

/**
 * PdfActionIcons - Action icons for PDF table rows
 * Shows delete and book icons on hover
 * 
 * @param onDelete - Function to call on delete click
 * @param onBook - Function to call on book click
 * @param isVisible - Whether icons should be visible
 * @param className - Additional CSS class
 * @returns JSX element
 */
export const PdfActionIcons: React.FC<PdfActionIconsProps> = ({
  onDelete,
  onBook,
  isVisible,
  className = '',
}) => {
  return (
    <div className={`${styles.actionIcons} ${className}`}>
      <button
        className={`${styles.deleteButton} ${isVisible ? styles.visible : styles.hidden}`}
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        title="Delete"
        aria-label="Delete"
      >
        <FiTrash2 />
      </button>
      <button
        className={styles.bookButton}
        onClick={(e) => {
          e.stopPropagation();
          onBook();
        }}
        title="View PDF"
        aria-label="View PDF"
      >
        <FiBook />
      </button>
    </div>
  );
};

PdfActionIcons.displayName = 'PdfActionIcons';

