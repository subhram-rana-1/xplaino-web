import React from 'react';
import { Star } from 'lucide-react';
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
          <div className={styles.metricsContainer}>
            <div className={styles.metricsRow}>
              <div className={styles.metric}>
                <span className={styles.metricValue}>
                  <span className={styles.starsRow} aria-hidden>
                    {[1,2,3,4,5].map((i) => (
                      <Star key={i} fill="currentColor" className={styles.starIcon} />
                    ))}
                  </span>
                  4.9/5
                </span>
                <span className={styles.metricLabel}>on Chrome Web Store</span>
              </div>
            </div>
          </div>
          <p className={styles.trustLine}>
            Trusted by Professionals, Researchers & Students
          </p>
        </section>
      </div>
    </ScrollReveal>
  );
};

SocialProof.displayName = 'SocialProof';
