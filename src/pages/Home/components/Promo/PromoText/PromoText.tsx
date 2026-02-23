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
        <span>AI Web Research & Second Brain System</span>
      </div>
      <h1 className={styles.heading}>
      Turn Information Overload into <span className={styles.headingHighlight}>Organized Intelligence</span>
      </h1>
      <p className={styles.description}>
      Xplaino transforms any webpage into structured summaries, contextual explanations, translations, and a personal knowledge system — automatically while you browse
      </p>
      <ChromeButton />
    </div>
  );
};

PromoText.displayName = 'PromoText';

