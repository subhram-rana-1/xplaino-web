import React from 'react';
import { FiTrash2, FiBookOpen, FiDownload } from 'react-icons/fi';
import styles from './PdfActionIcons.module.css';

export interface PdfActionIconsProps {
  onDelete: () => void;
  onBook: () => void;
  onDownload: () => void;
  isVisible: boolean;
  canDownload?: boolean;
  className?: string;
}

/**
 * PdfActionIcons - Action icons for PDF table rows
 * Shows view, download and delete icons on hover
 */
export const PdfActionIcons: React.FC<PdfActionIconsProps> = ({
  onDelete,
  onBook,
  onDownload,
  isVisible,
  canDownload = true,
  className = '',
}) => {
  return (
    <div className={`${styles.actionIcons} ${className}`}>
      <button
        className={styles.bookButton}
        onClick={(e) => {
          e.stopPropagation();
          onBook();
        }}
        title="View PDF"
        aria-label="View PDF"
      >
        <FiBookOpen />
      </button>
      {canDownload && (
        <button
          className={`${styles.downloadButton} ${isVisible ? styles.visible : styles.hidden}`}
          onClick={(e) => {
            e.stopPropagation();
            onDownload();
          }}
          title="Download"
          aria-label="Download"
        >
          <FiDownload />
        </button>
      )}
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
    </div>
  );
};

PdfActionIcons.displayName = 'PdfActionIcons';

