import React from 'react';
import { Star } from 'lucide-react';
import styles from './PromoText.module.css';

/**
 * PromoText - Promo text section with heading, description, and metrics
 * 
 * @returns JSX element
 */
export const PromoText: React.FC = () => {
  return (
    <div className={styles.promoText}>
      <h1 className={styles.heading}>
      Turn Information Overload into <span className={styles.headingHighlight}>Organized Intelligence</span> — across Webpages and PDFs
      </h1>
      <p className={styles.description}>
        Understand any webpage instantly and go deeper with PDFs — chat with documents, highlight what matters, take notes, and learn collaboratively. Translate in 50+ languages.
      </p>
      <p className={styles.tagline}>
        Xplaino works silently as you browse, so nothing slips through the cracks.
      </p>
      <div className={styles.mobileMetrics} aria-label="Social proof">
        <div className={styles.mobileMetric}>
          <span className={styles.mobileStarsRow} aria-hidden>
            {[1,2,3,4,5].map((i) => (
              <Star key={i} fill="currentColor" className={styles.mobileStarIcon} />
            ))}
          </span>
          <span className={styles.mobileMetricValue}>4.9/5</span>
          <span className={styles.mobileMetricLabel}>on Chrome Web Store</span>
        </div>
      </div>
    </div>
  );
};

PromoText.displayName = 'PromoText';

