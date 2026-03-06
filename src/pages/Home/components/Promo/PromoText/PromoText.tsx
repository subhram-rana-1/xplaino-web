import React from 'react';
import { Sparkles, Star, Globe } from 'lucide-react';
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
        <Sparkles className={styles.badgeIcon} />
        <span>AI Web Research & Second Brain System</span>
      </div>
      <h1 className={styles.heading}>
      Turn Information Overload into <span className={styles.headingHighlight}>Organized Intelligence</span>
      </h1>
      <p className={styles.description}>
      Xplaino transforms any webpage into structured summaries, contextual explanations, translations, and a personal knowledge system — automatically while you browse
      </p>
      <div className={styles.mobileMetrics} aria-label="Social proof">
        <div className={styles.mobileMetric}>
          <span className={styles.mobileMetricValue}>
            <Star aria-hidden />
            4.9/5
          </span>
          <span className={styles.mobileMetricLabel}>on Chrome Web Store</span>
        </div>
        <div className={styles.mobileMetricDivider} aria-hidden />
        <div className={styles.mobileMetric}>
          <span className={styles.mobileMetricValue}>
            <Globe aria-hidden />
            10+
          </span>
          <span className={styles.mobileMetricLabel}>countries</span>
        </div>
      </div>
      <ChromeButton />
    </div>
  );
};

PromoText.displayName = 'PromoText';

