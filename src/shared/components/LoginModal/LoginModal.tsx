import React, { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '@/shared/hooks/useAuth';
import { FiX } from 'react-icons/fi';
import styles from './LoginModal.module.css';
import loginStyles from '../../../pages/Login/Login.module.css';

interface LoginModalProps {
  actionText: string;
  onClose?: () => void;
}

/**
 * LoginModal - Inline login component with Google sign-in
 * Displays the same design as the /login page with action text above the button
 *
 * @param props - Component props
 * @returns JSX element
 */
export const LoginModal: React.FC<LoginModalProps> = ({ actionText, onClose }) => {
  const { login, isLoading: authLoading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      setIsLoading(true);
      setError(null);

      if (!credentialResponse.credential) {
        throw new Error('No credential received from Google');
      }

      await login(credentialResponse.credential);
    } catch (err) {
      console.error('Login error:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to login. Please try again.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError('Google sign-in was cancelled or failed. Please try again.');
  };

  return (
    <div className={styles.modalWrapper}>
      <div className={styles.modalContent}>
        <div className={styles.modalContainer}>
          {onClose && (
            <button
              className={styles.closeButton}
              onClick={onClose}
              aria-label="Close modal"
            >
              <FiX size={20} />
            </button>
          )}
          <p className={styles.actionText}>Login to {actionText}</p>
          <div className={loginStyles.googleButtonWrapper}>
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              useOneTap={false}
            />
          </div>
          {error && (
            <div className={loginStyles.errorMessage}>{error}</div>
          )}
          {(isLoading || authLoading) && (
            <div className={loginStyles.loadingMessage}>Signing in...</div>
          )}
        </div>
      </div>
    </div>
  );
};

LoginModal.displayName = 'LoginModal';


