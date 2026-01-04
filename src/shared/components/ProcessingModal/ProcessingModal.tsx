import React from 'react';
import { FiRefreshCw } from 'react-icons/fi';
import styles from './ProcessingModal.module.css';

export interface ProcessingModalProps {
  isOpen: boolean;
  message?: string;
}

/**
 * ProcessingModal - Modal for showing processing/loading state
 * Non-dismissible modal that shows during async operations
 * 
 * @param isOpen - Whether the modal is open
 * @param message - Optional custom message (defaults to "Processing...")
 * @returns JSX element
 */
export const ProcessingModal: React.FC<ProcessingModalProps> = ({
  isOpen,
  message = 'Processing...',
}) => {
  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.content}>
          <FiRefreshCw className={styles.spinner} />
          <p className={styles.message}>{message}</p>
        </div>
      </div>
    </div>
  );
};

ProcessingModal.displayName = 'ProcessingModal';

