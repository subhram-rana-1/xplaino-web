import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { usePageTitle } from '@/shared/hooks/usePageTitle';
import styles from './PaymentSuccess.module.css';

/**
 * PaymentSuccess - Page displayed after successful Paddle checkout
 * 
 * Paddle redirects here with query params like ?_ptxn=txn_01abc123...
 * 
 * @returns JSX element
 */
export const PaymentSuccess: React.FC = () => {
  usePageTitle('Payment Successful – Welcome to Xplaino!');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Paddle sends transaction ID as _ptxn parameter
  const transactionId = searchParams.get('_ptxn');

  const handleGoToDashboard = () => {
    navigate('/user/dashboard');
  };

  const handleGoToAccount = () => {
    navigate('/user/account');
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        {/* Success Icon */}
        <div className={styles.iconContainer}>
          <div className={styles.successIcon}>
            <svg 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="3"
              strokeLinecap="round" 
              strokeLinejoin="round"
              className={styles.checkmark}
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        </div>

        {/* Success Message */}
        <h1 className={styles.title}>Payment Successful!</h1>
        <p className={styles.message}>
          Thank you for your purchase. Your subscription is now active.
        </p>

        {/* Transaction ID */}
        {transactionId && (
          <div className={styles.transactionInfo}>
            <span className={styles.transactionLabel}>Transaction ID:</span>
            <code className={styles.transactionId}>{transactionId}</code>
          </div>
        )}

        {/* Action Buttons */}
        <div className={styles.actions}>
          <button 
            className={styles.primaryButton}
            onClick={handleGoToDashboard}
          >
            <svg 
              className={styles.buttonIcon}
              width="18" 
              height="18" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
            Dashboard
          </button>
          <button 
            className={styles.secondaryButton}
            onClick={handleGoToAccount}
          >
            <svg 
              className={styles.buttonIcon}
              width="18" 
              height="18" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            My Account
          </button>
        </div>
      </div>
    </div>
  );
};

PaymentSuccess.displayName = 'PaymentSuccess';
