import React from 'react';
import { HiSparkles } from 'react-icons/hi2';
import { ChromeButton } from '@/shared/components/ChromeButton';
import styles from './PromoText.module.css';

/**
 * PromoText - Promo text section with heading, description, and Chrome button
 * 
 * @returns JSX element
 */
export const PromoText: React.FC = () => {
  return (
    <div className={styles.promoText}>
      <div className={styles.badge}>
        <HiSparkles className={styles.badgeIcon} />
        <span>AI-Powered Browser Extension</span>
      </div>
      <h1 className={styles.heading}>
        Learn faster
        <br />
        <span className={styles.headingHighlight}>with AI</span>
        <br />
        while browsing
      </h1>
      <p className={styles.description}>
        Get AI-powered contextual explanations, summaries, and instant answers in any language—<span className={styles.highlight}>right as you browse</span>
          <br/>
          Your all-in-one bookmark manager.
      </p>
      <ChromeButton />
    </div>
  );
};

PromoText.displayName = 'PromoText';

