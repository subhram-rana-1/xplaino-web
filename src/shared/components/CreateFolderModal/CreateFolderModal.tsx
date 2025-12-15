import React, { useState, useEffect } from 'react';
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
  const [isOpening, setIsOpening] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsClosing(false);
      // Start with opening state, then animate to open
      setIsOpening(true);
      const timer = setTimeout(() => {
        setIsOpening(false);
      }, 10); // Small delay to ensure opening class is applied first
      return () => clearTimeout(timer);
    } else {
      setIsOpening(false);
    }
  }, [isOpen]);

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
      className={`${styles.overlay} ${isClosing ? styles.closing : ''} ${isOpening ? styles.opening : ''}`} 
      onClick={handleClose}
    >
      <div 
        className={`${styles.modal} ${isClosing ? styles.closing : ''} ${isOpening ? styles.opening : ''}`} 
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="folderName" className={styles.label}>
              Folder Name
            </label>
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
            {currentFolderName && (
              <p className={styles.hint}>
                This folder will be created in: {currentFolderName}
              </p>
            )}
          </div>

          {error && <div className={styles.errorMessage}>{error}</div>}

          <div className={styles.actions}>
            <button
              type="button"
              onClick={handleClose}
              className={styles.cancelButton}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.createButton}
              disabled={isLoading || !folderName.trim()}
            >
              {isLoading ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

CreateFolderModal.displayName = 'CreateFolderModal';

