import React from 'react';
import { ScrollReveal } from '@/shared/components/ScrollReveal';
import styles from './SocialProof.module.css';

/**
 * SocialProof - Prominent social proof section above Problem section
 *
 * @returns JSX element
 */
export const SocialProof: React.FC = () => {
  return (
    <ScrollReveal variant="fadeUp">
      <div className={styles.wrapper}>
        <section className={styles.section} aria-label="Social proof">
          <div className={styles.metricsRow}>
            <div className={styles.metric}>
              <span className={styles.metricValue}>
                <span className={styles.starIcon} aria-hidden>⭐</span>
                4.9/5
              </span>
              <span className={styles.metricLabel}>on Chrome Web Store</span>
            </div>
            <div className={styles.metricDivider} aria-hidden />
            <div className={styles.metric}>
              <span className={styles.metricValue}>
                <span className={styles.globeIcon} aria-hidden>🌍</span>
                10+
              </span>
              <span className={styles.metricLabel}>countries</span>
            </div>
          </div>
          <p className={styles.trustLine}>
            Trusted by students, researchers & professionals — already used across 10+ countries.
          </p>
        </section>
      </div>
    </ScrollReveal>
  );
};

SocialProof.displayName = 'SocialProof';
