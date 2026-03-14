import React from 'react';
import { Star, Globe } from 'lucide-react';
import { ScrollReveal } from '@/shared/components/ScrollReveal';
import styles from './SocialProof.module.css';

const LaurelSprig: React.FC<{ mirrored?: boolean }> = ({ mirrored = false }) => (
  <svg
    width="26"
    height="78"
    viewBox="0 0 26 78"
    fill="none"
    aria-hidden
    className={styles.laurel}
    style={mirrored ? { transform: 'scaleX(-1)' } : undefined}
  >
    {/* stem */}
    <path d="M9 3 C9.5 26 10 50 11 75" stroke="#c8a84b" strokeWidth="1.5" strokeLinecap="round" />
    {/* leaves pointing right toward center */}
    <path d="M9 11 C13 7 20 9 19 14 C16 11 10 12 9 11Z" fill="#c8a84b" opacity="0.80" />
    <path d="M9 21 C13 17 20 19 19 24 C16 21 10 22 9 21Z" fill="#c8a84b" opacity="0.76" />
    <path d="M9 31 C13 27 20 29 19 34 C16 31 10 32 9 31Z" fill="#c8a84b" opacity="0.72" />
    <path d="M10 41 C14 37 21 39 20 44 C17 41 11 42 10 41Z" fill="#c8a84b" opacity="0.67" />
    <path d="M10 51 C14 47 21 49 20 54 C17 51 11 52 10 51Z" fill="#c8a84b" opacity="0.62" />
    <path d="M10 61 C14 57 21 59 20 64 C17 61 11 62 10 61Z" fill="#c8a84b" opacity="0.56" />
    <path d="M11 71 C15 67 22 69 21 74 C18 71 12 72 11 71Z" fill="#c8a84b" opacity="0.50" />
  </svg>
);

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
                  <span className={styles.metricIcon} aria-hidden>
                    <Star />
                  </span>
                  4.9/5
                </span>
                <span className={styles.metricLabel}>on Chrome Web Store</span>
              </div>
              <div className={styles.metricDivider} aria-hidden />
              <div className={styles.metric}>
                <span className={styles.metricValue}>
                  <span className={styles.metricIcon} aria-hidden>
                    <Globe />
                  </span>
                  10+
                </span>
                <span className={styles.metricLabel}>countries</span>
              </div>
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
