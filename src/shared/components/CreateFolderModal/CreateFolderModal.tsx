import React, { useState } from 'react';
import { FiX, FiArrowRight } from 'react-icons/fi';
import styles from './CreateFolderModal.module.css';

interface CreateFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string) => Promise<void>;
  currentFolderName?: string;
}

/**
 * CreateFolderModal - Modal for creating a new folder
 * 
 * @param isOpen - Whether the modal is open
 * @param onClose - Function to close the modal
 * @param onCreate - Function to create the folder (receives folder name)
 * @param currentFolderName - Optional name of current folder for context
 * @returns JSX element
 */
export const CreateFolderModal: React.FC<CreateFolderModalProps> = ({
  isOpen,
  onClose,
  onCreate,
  currentFolderName,
}) => {
  const [folderName, setFolderName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  if (!isOpen && !isClosing) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!folderName.trim()) {
      setError('Folder name is required');
      return;
    }

    if (folderName.trim().length > 50) {
      setError('Folder name must be 50 characters or less');
      return;
    }

    try {
      setIsLoading(true);
      await onCreate(folderName.trim());
      setFolderName('');
      onClose();
    } catch (err) {
      console.error('Error creating folder:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to create folder. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setIsClosing(true);
      setTimeout(() => {
        setFolderName('');
        setError(null);
        setIsClosing(false);
        onClose();
      }, 300); // Match animation duration
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
          <h2 className={styles.title}>Create new folder</h2>
          <button
            type="button"
            onClick={handleClose}
            className={styles.closeButton}
            disabled={isLoading}
            aria-label="Close"
          >
            <FiX />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputWrapper}>
            <input
              id="folderName"
              type="text"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              className={styles.input}
              placeholder="Enter folder name"
              maxLength={50}
              disabled={isLoading}
              autoFocus
            />
            <button
              type="submit"
              className={styles.submitButton}
              disabled={isLoading || !folderName.trim()}
              aria-label="Create folder"
            >
              <FiArrowRight />
            </button>
          </div>

          {currentFolderName && (
            <p className={styles.hint}>
              This folder will be created in: {currentFolderName}
            </p>
          )}

          {error && <div className={styles.errorMessage}>{error}</div>}
        </form>
      </div>
    </div>
  );
};

CreateFolderModal.displayName = 'CreateFolderModal';

