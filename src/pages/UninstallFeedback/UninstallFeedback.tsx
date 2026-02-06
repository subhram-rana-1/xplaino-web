import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchPublic, extractErrorMessage } from '@/shared/services/api-client';
import { authConfig } from '@/config/auth.config';
import styles from './UninstallFeedback.module.css';

/**
 * Enum values matching the backend ExtensionUninstallationReason enum
 */
const UNINSTALL_REASONS = [
  { value: 'TOO_EXPENSIVE', label: 'Too expensive' },
  { value: 'NOT_USING', label: 'Not using it enough' },
  { value: 'FOUND_ALTERNATIVE', label: 'Found a better alternative' },
  { value: 'MISSING_FEATURES', label: 'Missing features I need' },
  { value: 'EXTENSION_NOT_WORKING', label: 'Extension wasn\'t working properly' },
  { value: 'OTHER', label: 'Other' },
] as const;

/**
 * UninstallFeedback - Public page for collecting extension uninstallation feedback
 * 
 * Users land here after uninstalling the Xplaino browser extension.
 * Collects a reason and optional free-text feedback, then shows a thank-you message.
 * 
 * @returns JSX element
 */
export const UninstallFeedback: React.FC = () => {
  const navigate = useNavigate();
  const [reason, setReason] = useState<string>('');
  const [userFeedback, setUserFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!reason) {
      return;
    }

    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const response = await fetchPublic(
        `${authConfig.catenBaseUrl}/api/extension-uninstall/feedback`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            reason,
            user_feedback: userFeedback.trim() || null,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          extractErrorMessage(errorData, 'Failed to submit feedback. Please try again.')
        );
      }

      setIsSuccess(true);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        {!isSuccess ? (
          <>
            <div className={styles.headerIcon}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18.36 6.64A9 9 0 0 1 20.77 15M5.64 18.36A9 9 0 0 1 3.23 9" />
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                <path d="M8.46 15.54a5 5 0 0 1 0-7.07" />
                <circle cx="12" cy="12" r="1" />
              </svg>
            </div>
            <h1 className={styles.title}>We're sorry to see you go</h1>
            <p className={styles.description}>
              Your feedback helps us improve Xplaino for everyone. Could you let us know why you uninstalled the extension?
            </p>

            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.reasonGroup}>
                <label className={styles.label}>
                  Reason for uninstalling <span className={styles.required}>*</span>
                </label>
                <div className={styles.reasonOptions}>
                  {UNINSTALL_REASONS.map((option) => (
                    <label
                      key={option.value}
                      className={`${styles.reasonCard} ${reason === option.value ? styles.reasonCardSelected : ''}`}
                    >
                      <input
                        type="radio"
                        name="reason"
                        value={option.value}
                        checked={reason === option.value}
                        onChange={(e) => setReason(e.target.value)}
                        className={styles.radioInput}
                      />
                      <span className={styles.radioIndicator} />
                      <span className={styles.reasonLabel}>{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className={styles.feedbackGroup}>
                <label htmlFor="userFeedback" className={styles.label}>
                  Tell us more <span className={styles.optional}>(optional)</span>
                </label>
                <textarea
                  id="userFeedback"
                  value={userFeedback}
                  onChange={(e) => setUserFeedback(e.target.value)}
                  placeholder="Share any additional thoughts or suggestions..."
                  className={styles.textarea}
                  rows={4}
                  disabled={isSubmitting}
                />
              </div>

              {errorMessage && (
                <div className={styles.errorMessage}>
                  {errorMessage}
                </div>
              )}

              <button
                type="submit"
                className={styles.submitButton}
                disabled={!reason || isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
              </button>
            </form>
          </>
        ) : (
          <div className={styles.successMessage}>
            <div className={styles.successIcon}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>
            <h2 className={styles.successTitle}>Thank You for Your Feedback!</h2>
            <p className={styles.successDescription}>
              We truly appreciate you taking the time to share your thoughts. Your feedback is invaluable and helps us make Xplaino better for everyone.
            </p>
            <p className={styles.gratitudeText}>
              Thank you for being a part of the Xplaino community. We're always working to improve, and if you ever want to give us another try, we'd love to have you back!
            </p>
            <button
              onClick={() => navigate('/')}
              className={styles.homeButton}
            >
              Back to Home
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

UninstallFeedback.displayName = 'UninstallFeedback';
