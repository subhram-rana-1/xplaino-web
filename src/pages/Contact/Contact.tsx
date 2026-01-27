import React, { useState } from 'react';
import styles from './Contact.module.css';

/**
 * Contact - Contact page component
 * 
 * @returns JSX element
 */
export const Contact: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const email = 'support@xplaino.com';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className={styles.contact}>
      <div className={styles.content}>
        <p className={styles.message}>We're here for you. Let's talk.</p>
        <div className={styles.emailContainer}>
          <span className={styles.email}>{email}</span>
          <div className={styles.copyButtonWrapper}>
            <button 
              className={`${styles.copyButton} ${copied ? styles.copied : ''}`}
              onClick={handleCopy}
              aria-label="Copy email address"
              title={copied ? 'Copied!' : 'Copy email'}
            >
              {copied ? (
                <svg 
                  className={styles.checkIcon} 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ) : (
                <svg 
                  className={styles.copyIcon} 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>
            {copied && <span className={styles.copiedMessage}>Copied</span>}
          </div>
        </div>
      </div>
    </div>
  );
};

Contact.displayName = 'Contact';

