import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { fetchPublic, extractErrorMessage } from '@/shared/services/api-client';
import { authConfig } from '@/config/auth.config';
import { usePageTitle } from '@/shared/hooks/usePageTitle';
import styles from './UninstallFeedback.module.css';

/**
 * Enum values matching the backend ExtensionUninstallationReason enum
 */
const UNINSTALL_REASONS = [
  { value: 'MISSING_FEATURES', label: 'Missing features I need' },
  { value: 'EXTENSION_NOT_WORKING', label: 'Extension wasn\'t working properly' },
  { value: 'TOO_EXPENSIVE', label: 'Too expensive' },
  { value: 'FOUND_ALTERNATIVE', label: 'Found a better alternative' },
  { value: 'NOT_USING', label: 'Not using it enough' },
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
  usePageTitle('Share Your Feedback – Xplaino Extension');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const emailFromUrl = searchParams.get('email') ?? undefined;
  const [reason, setReason] = useState<string>('');
  const [userFeedback, setUserFeedback] = useState('');
  const [webpageUrl, setWebpageUrl] = useState('');
  const [desiredPrice, setDesiredPrice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!reason) return;
    if (reason === 'MISSING_FEATURES' && !userFeedback.trim()) return;
    if (reason === 'EXTENSION_NOT_WORKING' && !webpageUrl.trim()) return;

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
            metadata: reason === 'MISSING_FEATURES'
              ? { featureMissing: userFeedback.trim(), userEmail: emailFromUrl }
              : reason === 'EXTENSION_NOT_WORKING'
                ? { webpageUrl: webpageUrl.trim(), userEmail: emailFromUrl }
                : reason === 'TOO_EXPENSIVE'
                  ? { desiredPrice: desiredPrice.trim() || undefined, userFeedback: userFeedback.trim() || undefined, userEmail: emailFromUrl }
                  : { userFeedback: userFeedback.trim() || undefined, userEmail: emailFromUrl },
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

      {/* Page header — shown only before submission */}
      {!isSuccess && (
        <div className={styles.pageHeader}>
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
        </div>
      )}

      {/* Side-by-side row: form/success on left, PDF promo on right */}
      <div className={styles.mainRow}>
        <div className={styles.content}>
          {!isSuccess ? (
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
                        onChange={(e) => {
                          setReason(e.target.value);
                          setUserFeedback('');
                          setWebpageUrl('');
                          setDesiredPrice('');
                        }}
                        className={styles.radioInput}
                      />
                      <span className={styles.radioIndicator} />
                      <span className={styles.reasonLabel}>{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {reason === 'MISSING_FEATURES' && (
                <div className={styles.feedbackGroup}>
                  <label htmlFor="userFeedback" className={styles.label}>
                    Tell us the feature you want <span className={styles.required}>*</span>
                  </label>
                  <textarea
                    id="userFeedback"
                    value={userFeedback}
                    onChange={(e) => setUserFeedback(e.target.value)}
                    placeholder="Describe the feature you need..."
                    className={styles.textarea}
                    rows={4}
                    disabled={isSubmitting}
                  />
                </div>
              )}

              {reason === 'EXTENSION_NOT_WORKING' && (
                <div className={styles.feedbackGroup}>
                  <label htmlFor="webpageUrl" className={styles.label}>
                    Share the webpage link where the extension was not working <span className={styles.required}>*</span>
                  </label>
                  <input
                    id="webpageUrl"
                    type="url"
                    value={webpageUrl}
                    onChange={(e) => setWebpageUrl(e.target.value)}
                    placeholder="https://example.com"
                    className={styles.input}
                    disabled={isSubmitting}
                  />
                </div>
              )}

              {reason === 'TOO_EXPENSIVE' && (
                <div className={styles.feedbackGroup}>
                  <label htmlFor="desiredPrice" className={styles.label}>
                    What price would you be willing to pay? <span className={styles.optional}>(per month)</span>
                  </label>
                  <input
                    id="desiredPrice"
                    type="text"
                    value={desiredPrice}
                    onChange={(e) => setDesiredPrice(e.target.value)}
                    // placeholder="e.g. $3/month, $5/month"
                    className={styles.input}
                    disabled={isSubmitting}
                  />
                  <label htmlFor="userFeedback" className={styles.label} style={{ marginTop: '0.75rem' }}>
                    Anything else? <span className={styles.optional}>(optional)</span>
                  </label>
                  <textarea
                    id="userFeedback"
                    value={userFeedback}
                    onChange={(e) => setUserFeedback(e.target.value)}
                    placeholder="Share any additional thoughts..."
                    className={styles.textarea}
                    rows={3}
                    disabled={isSubmitting}
                  />
                </div>
              )}

              {reason !== '' && reason !== 'MISSING_FEATURES' && reason !== 'EXTENSION_NOT_WORKING' && reason !== 'TOO_EXPENSIVE' && (
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
              )}

              {errorMessage && (
                <div className={styles.errorMessage}>
                  {errorMessage}
                </div>
              )}

              <button
                type="submit"
                className={styles.submitButton}
                disabled={
                  !reason ||
                  (reason === 'MISSING_FEATURES' && !userFeedback.trim()) ||
                  (reason === 'EXTENSION_NOT_WORKING' && !webpageUrl.trim()) ||
                  isSubmitting
                }
              >
                {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
              </button>
            </form>
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

        {/* PDF Feature Promo — always visible */}
        <div className={styles.pdfPromo}>
          <div className={styles.pdfPromoBadge}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            No install needed
          </div>
          <h3 className={styles.pdfPromoTitle}>Try our free AI PDF tool</h3>
          <ul className={styles.pdfPromoList}>
            <li>Chat with any PDF — get cited answers instantly</li>
            <li>Highlight, annotate &amp; add personal notes</li>
            <li>Collaborate with teammates on the same doc</li>
            <li>Share via link or post to LinkedIn, X, WhatsApp</li>
          </ul>
          <button
            onClick={() => navigate('/tools/pdf')}
            className={styles.pdfPromoButton}
          >
            Try PDF Tool — It's Free
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

UninstallFeedback.displayName = 'UninstallFeedback';
