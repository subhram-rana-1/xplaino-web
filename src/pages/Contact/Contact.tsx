import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Shield, HeartHandshake } from 'lucide-react';
import { usePageTitle } from '@/shared/hooks/usePageTitle';
import styles from './Contact.module.css';

/**
 * Contact - Contact page with trust messaging, email, and raise issue CTA
 */
export const Contact: React.FC = () => {
  usePageTitle('Contact Us – Xplaino Support');
  const [copied, setCopied] = useState(false);
  const email = 'support@xplaino.com';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className={styles.contact}>
      <div className={styles.content}>
        <div className={styles.trustSection}>
          <h1 className={styles.heading}>We&apos;re with you — always.</h1>
          <p className={styles.subtext}>
            Whether it&apos;s a bug, a question, or a feature idea — real people are behind every response. No bots, no ticket queues that go nowhere.
          </p>
          <div className={styles.trustBadges}>
            <div className={styles.badge}>
              <HeartHandshake className={styles.badgeIcon} />
              <span>Human-first support</span>
            </div>
            <div className={styles.badge}>
              <Shield className={styles.badgeIcon} />
              <span>Your data, your control</span>
            </div>
          </div>
        </div>

        <div className={styles.issueCard}>
          <div className={styles.issueCardLeft}>
            <div className={`${styles.cardIconWrap} ${styles.cardIconIssue}`}>
              <AlertCircle />
            </div>
            <div className={styles.issueCardText}>
              <span className={styles.recommended}>Recommended</span>
              <h2 className={styles.cardTitle}>Raise an issue</h2>
              <p className={styles.cardDescription}>
                Found a bug or want a new feature? Report it directly — we track and act on every request.
              </p>
            </div>
          </div>
          <Link to="/report-issue" className={styles.issueButton}>
            Report Issue
          </Link>
        </div>

        <p className={styles.emailLine}>
          Or email us at{' '}
          <span className={styles.email}>{email}</span>
          <button
            className={`${styles.copyButton} ${copied ? styles.copied : ''}`}
            onClick={handleCopy}
            aria-label="Copy email address"
            title={copied ? 'Copied!' : 'Copy email'}
          >
            {copied ? (
              <svg className={styles.checkIcon} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            ) : (
              <svg className={styles.copyIconSvg} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </button>
          {copied && <span className={styles.copiedMessage}>Copied!</span>}
          {' '}for general queries or partnerships.
        </p>
      </div>
    </div>
  );
};

Contact.displayName = 'Contact';
