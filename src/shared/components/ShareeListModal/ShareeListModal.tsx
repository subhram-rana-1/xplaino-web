import React from 'react';
import { FiX, FiUserMinus, FiUsers } from 'react-icons/fi';
import type { ShareeItem } from '@/shared/types/folders.types';
import styles from './ShareeListModal.module.css';

interface ShareeListModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  sharees: ShareeItem[];
  isLoading: boolean;
  onUnshare: (email: string) => Promise<void>;
}

const formatDate = (dateString: string): string => {
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateString;
  }
};

export const ShareeListModal: React.FC<ShareeListModalProps> = ({
  isOpen,
  onClose,
  title,
  sharees,
  isLoading,
  onUnshare,
}) => {
  const [removingEmail, setRemovingEmail] = React.useState<string | null>(null);
  const [isClosing, setIsClosing] = React.useState(false);

  if (!isOpen && !isClosing) return null;

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 300);
  };

  const handleUnshare = async (email: string) => {
    setRemovingEmail(email);
    try {
      await onUnshare(email);
    } finally {
      setRemovingEmail(null);
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
        <div className={styles.header}>
          <h2 className={styles.title}>{title}</h2>
          <button
            type="button"
            onClick={handleClose}
            className={styles.closeButton}
            aria-label="Close"
          >
            <FiX />
          </button>
        </div>

        <div className={styles.body}>
          {isLoading ? (
            <div className={styles.loadingState}>Loading shared list...</div>
          ) : sharees.length === 0 ? (
            <div className={styles.emptyState}>
              <FiUsers className={styles.emptyIcon} />
              <p className={styles.emptyText}>Not shared with anyone yet.</p>
            </div>
          ) : (
            <ul className={styles.shareeList}>
              {sharees.map((sharee) => (
                <li key={sharee.email} className={styles.shareeRow}>
                  <div className={styles.shareeInfo}>
                    <span className={styles.shareeEmail}>{sharee.email}</span>
                    <span className={styles.shareeDate}>
                      Shared on {formatDate(sharee.shared_at)}
                    </span>
                  </div>
                  <button
                    className={styles.unshareButton}
                    onClick={() => handleUnshare(sharee.email)}
                    disabled={removingEmail === sharee.email}
                    title={`Remove access for ${sharee.email}`}
                    aria-label={`Remove access for ${sharee.email}`}
                  >
                    {removingEmail === sharee.email ? (
                      <span className={styles.removingText}>Removing...</span>
                    ) : (
                      <>
                        <FiUserMinus />
                        <span>Remove</span>
                      </>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

ShareeListModal.displayName = 'ShareeListModal';
