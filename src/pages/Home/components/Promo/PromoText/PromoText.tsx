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
        Maximise your{' '}
        <span className={styles.headingHighlight}>contextual understanding</span>{' '}
        while browsing
      </h1>
      <p className={styles.description}>
        Get AI-powered contextual explanations, summaries, and instant answers in any language—right as you browse
      </p>
      <ChromeButton />
    </div>
  );
};

PromoText.displayName = 'PromoText';

