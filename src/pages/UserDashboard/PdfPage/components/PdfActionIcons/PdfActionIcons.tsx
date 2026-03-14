import React from 'react';
import { Trash2, Download, Share2, Users } from 'lucide-react';
import styles from './PdfActionIcons.module.css';

export interface PdfActionIconsProps {
  onDelete: () => void;
  onBook: () => void;
  onDownload: () => void;
  onShare?: () => void;
  onManageSharing?: () => void;
  isVisible: boolean;
  canDownload?: boolean;
  className?: string;
}

export const PdfActionIcons: React.FC<PdfActionIconsProps> = ({
  onDelete,
  onDownload,
  onShare,
  onManageSharing,
  canDownload = true,
  className = '',
}) => {
  return (
    <div className={`${styles.actionIcons} ${className}`} onClick={(e) => e.stopPropagation()}>
      {/* Share — always visible */}
      {onShare && (
        <button
          className={styles.alwaysBtn}
          onClick={(e) => { e.stopPropagation(); onShare(); }}
          title="Share PDF"
          aria-label="Share PDF"
        >
          <Share2 size={16} />
        </button>
      )}

      {/* Manage sharing — always visible */}
      {onManageSharing && (
        <button
          className={styles.alwaysBtn}
          onClick={(e) => { e.stopPropagation(); onManageSharing(); }}
          title="Manage sharing"
          aria-label="Manage sharing"
        >
          <Users size={16} />
        </button>
      )}

      {/* Download — always visible */}
      {canDownload && (
        <button
          className={styles.alwaysBtn}
          onClick={(e) => { e.stopPropagation(); onDownload(); }}
          title="Download"
          aria-label="Download"
        >
          <Download size={16} />
        </button>
      )}

      {/* Delete — direct button */}
      <button
        className={`${styles.alwaysBtn} ${styles.deleteBtn}`}
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        title="Delete PDF"
        aria-label="Delete PDF"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
};

PdfActionIcons.displayName = 'PdfActionIcons';
