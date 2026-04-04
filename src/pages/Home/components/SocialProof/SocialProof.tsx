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
          <p className={styles.trustLine}>
            Trusted by Professionals, Researchers & Students
          </p>
        </section>
      </div>
    </ScrollReveal>
  );
};

SocialProof.displayName = 'SocialProof';
