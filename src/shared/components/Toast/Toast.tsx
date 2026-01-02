import React, { useEffect } from 'react';
import { FiX } from 'react-icons/fi';
import styles from './Toast.module.css';

export interface ToastProps {
  message: string;
  onClose: () => void;
  duration?: number;
  type?: 'success' | 'error';
}

export const Toast: React.FC<ToastProps> = ({ message, onClose, duration = 3000, type = 'success' }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div className={`${styles.toast} ${type === 'error' ? styles.toastError : ''}`}>
      <span className={styles.message}>{message}</span>
      <button 
        className={styles.closeButton}
        onClick={onClose}
        aria-label="Close toast"
      >
        <FiX size={18} />
      </button>
    </div>
  );
};

Toast.displayName = 'Toast';

