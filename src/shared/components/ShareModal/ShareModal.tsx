import React, { useState } from 'react';
import { X, ArrowRight, UserMinus, Users } from 'lucide-react';
import type { ShareeItem } from '@/shared/types/folders.types';
import styles from './ShareModal.module.css';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShare: (email: string) => Promise<void>;
  title: string;
  sharees?: ShareeItem[];
  isLoadingSharees?: boolean;
  onUnshare?: (email: string) => Promise<void>;
}

const formatDate = (dateString: string): string => {
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  } catch {
    return dateString;
  }
};

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  onShare,
  title,
  sharees,
  isLoadingSharees,
  onUnshare,
}) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [removingEmail, setRemovingEmail] = useState<string | null>(null);

  if (!isOpen && !isClosing) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('Email address is required');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      setIsLoading(true);
      await onShare(trimmedEmail);
      setSuccessMessage(`Shared successfully with ${trimmedEmail}`);
      setEmail('');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to share';
      if (message.toLowerCase().includes('already shared')) {
        setError(`Already shared with ${trimmedEmail}`);
      } else {
        setError(message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setIsClosing(true);
      setTimeout(() => {
        setEmail('');
        setError(null);
        setSuccessMessage(null);
        setIsClosing(false);
        onClose();
      }, 300);
    }
  };

  const handleUnshare = async (shareeEmail: string) => {
    if (!onUnshare) return;
    setRemovingEmail(shareeEmail);
    try {
      await onUnshare(shareeEmail);
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
            disabled={isLoading}
            aria-label="Close"
          >
            <X />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <p className={styles.description}>
            Enter the email address of the person you want to share with.
          </p>
          <div className={styles.inputWrapper}>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError(null);
                setSuccessMessage(null);
              }}
              className={`${styles.input} ${error ? styles.inputError : ''}`}
              placeholder="Enter email address"
              disabled={isLoading}
              autoFocus
            />
            <button
              type="submit"
              className={styles.submitButton}
              disabled={isLoading || !email.trim()}
              aria-label="Share"
            >
              <ArrowRight />
            </button>
          </div>

          {successMessage && (
            <div className={styles.successMessage}>{successMessage}</div>
          )}
          {error && (
            <div className={styles.errorMessage}>{error}</div>
          )}
        </form>

        {/* People with access section */}
        {onUnshare !== undefined && (
          <div className={styles.shareeSection}>
            <div className={styles.shareeDivider}>
              <span className={styles.shareeDividerText}>People with access</span>
            </div>
            {isLoadingSharees ? (
              <div className={styles.shareeLoading}>Loading...</div>
            ) : !sharees || sharees.length === 0 ? (
              <div className={styles.shareeEmpty}>
                <Users className={styles.shareeEmptyIcon} />
                <span>Not shared with anyone yet.</span>
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
                      type="button"
                      className={styles.unshareButton}
                      onClick={() => handleUnshare(sharee.email)}
                      disabled={removingEmail === sharee.email}
                      title={`Remove access for ${sharee.email}`}
                      aria-label={`Remove access for ${sharee.email}`}
                    >
                      {removingEmail === sharee.email ? (
                        <span>Removing...</span>
                      ) : (
                        <>
                          <UserMinus size={13} />
                          <span>Remove</span>
                        </>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

ShareModal.displayName = 'ShareModal';
