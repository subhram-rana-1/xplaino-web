import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './SubscriptionRequiredModal.module.css';

/**
 * SubscriptionRequiredModal - Global modal that appears when API returns SUBSCRIPTION_REQUIRED error
 * 
 * Listens for 'subscriptionRequired' window event dispatched by fetchWithAuth
 * Shows a modal prompting user to upgrade their subscription plan
 */
export const SubscriptionRequiredModal: React.FC = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [message, setMessage] = useState('');

  // Handle the subscriptionRequired event
  const handleSubscriptionRequired = useCallback((event: Event) => {
    const customEvent = event as CustomEvent<{ message?: string }>;
    setMessage(customEvent.detail?.message || 'Upgrade your plan to access this feature');
    setIsClosing(false);
    setIsOpen(true);
  }, []);

  // Listen for subscriptionRequired event
  useEffect(() => {
    window.addEventListener('subscriptionRequired', handleSubscriptionRequired);
    return () => {
      window.removeEventListener('subscriptionRequired', handleSubscriptionRequired);
    };
  }, [handleSubscriptionRequired]);

  // Reset closing state when modal opens
  useEffect(() => {
    if (isOpen) {
      setIsClosing(false);
    }
  }, [isOpen]);

  // Handle close with animation
  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      setIsOpen(false);
    }, 300);
  }, []);

  // Handle upgrade button click
  const handleUpgrade = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      setIsOpen(false);
      navigate('/user/account/subscription');
    }, 300);
  }, [navigate]);

  if (!isOpen && !isClosing) return null;

  return (
    <div 
      className={`${styles.overlay} ${isClosing ? styles.closing : ''}`} 
      onClick={handleClose}
    >
      <div 
        className={`${styles.modal} ${isClosing ? styles.closing : ''}`} 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Upgrade Icon */}
        <div className={styles.iconContainer}>
          <svg 
            width="48" 
            height="48" 
            viewBox="0 0 24 24" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path 
              d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" 
              fill="url(#upgradeGradient)"
            />
            <defs>
              <linearGradient id="upgradeGradient" x1="2" y1="2" x2="22" y2="21">
                <stop offset="0%" stopColor="#ef4444" />
                <stop offset="33%" stopColor="#f97316" />
                <stop offset="66%" stopColor="#eab308" />
                <stop offset="100%" stopColor="#ec4899" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Title */}
        <h2 className={styles.title}>Plan Upgrade Required</h2>

        {/* Message */}
        <p className={styles.message}>{message}</p>

        {/* Buttons */}
        <div className={styles.buttons}>
          <button className={styles.cancelButton} onClick={handleClose}>
            Maybe Later
          </button>
          <button className={styles.upgradeButton} onClick={handleUpgrade}>
            <svg 
              width="18" 
              height="18" 
              viewBox="0 0 24 24" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path 
                d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" 
                fill="currentColor"
              />
            </svg>
            Upgrade current plan
          </button>
        </div>
      </div>
    </div>
  );
};

SubscriptionRequiredModal.displayName = 'SubscriptionRequiredModal';
