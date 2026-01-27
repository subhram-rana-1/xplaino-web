import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchPublic } from '@/shared/services/api-client';
import { authConfig } from '@/config/auth.config';
import styles from './PreLaunch.module.css';

/**
 * PreLaunch - Pre-launch registration page
 * 
 * Collects user email for pre-launch interest registration
 * 
 * @returns JSX element
 */
export const PreLaunch: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [validationError, setValidationError] = useState('');

  /**
   * Validates email format
   * Returns true if valid, false otherwise
   */
  const validateEmail = (emailValue: string): boolean => {
    if (!emailValue.trim()) {
      return false;
    }
    
    // Basic email regex pattern
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailValue);
  };

  /**
   * Handles email input change with validation
   */
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    
    // Clear previous messages
    setErrorMessage('');
    setInfoMessage('');
    
    // Validate only if user has entered something
    if (value.trim()) {
      if (!validateEmail(value)) {
        setValidationError('Please enter a valid email address');
      } else {
        setValidationError('');
      }
    } else {
      setValidationError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate email before submission
    if (!validateEmail(email)) {
      setValidationError('Please enter a valid email address');
      return;
    }
    
    // Reset states
    setErrorMessage('');
    setInfoMessage('');
    setValidationError('');
    setIsSubmitting(true);

    try {
      const response = await fetchPublic(`${authConfig.catenBaseUrl}/api/pre-launch-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          metaInfo: {
            source: 'chrome_button',
            timestamp: new Date().toISOString(),
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail?.error_message || 'Failed to register. Please try again.');
      }

      // Parse response to check for EMAIL_ALREADY_EXISTS
      const responseData = await response.json();
      
      if (responseData.code === 'EMAIL_ALREADY_EXISTS') {
        // Email already registered - show friendly info message
        setInfoMessage('Your email is already in our list! We will keep you updated via email once our product is launched. Thank you for your interest!');
        setEmail('');
      } else {
        // New registration - show success message
        setIsSuccess(true);
        setEmail('');
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        {!isSuccess ? (
          <>
            <h1 className={styles.title}>Thank You for Your Interest in Xplaino!</h1>
            <p className={styles.description}>
              We're excited to have you join us on this journey. Enter your email below to stay updated on our launch and be the first to know when Xplaino goes live.
            </p>
            
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.inputGroup}>
                <label htmlFor="email" className={styles.label}>
                  Email Address <span className={styles.required}>*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={handleEmailChange}
                  required
                  placeholder="your.email@example.com"
                  className={`${styles.input} ${validationError ? styles.inputError : ''}`}
                  disabled={isSubmitting}
                />
                {validationError && (
                  <div className={styles.validationError}>
                    {validationError}
                  </div>
                )}
              </div>

              {errorMessage && (
                <div className={styles.errorMessage}>
                  {errorMessage}
                </div>
              )}

              {infoMessage && (
                <div className={styles.infoMessage}>
                  {infoMessage}
                </div>
              )}

              <button
                type="submit"
                className={styles.submitButton}
                disabled={isSubmitting || !email.trim() || !!validationError}
              >
                {isSubmitting ? 'Registering your email...' : 'Notify me when launched'}
              </button>
            </form>
          </>
        ) : (
          <div className={styles.successMessage}>
            <div className={styles.successIcon}>✓</div>
            <h2 className={styles.successTitle}>Successfully Registered!</h2>
            <p className={styles.successDescription}>
              Thank you for registering your interest. We'll keep you updated on our launch and exciting new features!
            </p>
            <button
              onClick={() => navigate('/')}
              className={styles.homeButton}
            >
              Go to Home
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

PreLaunch.displayName = 'PreLaunch';
