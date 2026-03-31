import React from 'react';
import { ScrollReveal } from '@/shared/components/ScrollReveal';
import styles from './IdentitySection.module.css';

const identityItems = [
  'Professionals who process large reports.',
  'Researchers who read papers daily.',
  'Language learners who study globally.',
  'Students who want structured revision.',
];

/**
 * IdentitySection - "Built for" identity positioning for self-selection
 *
 * @returns JSX element
 */
export const IdentitySection: React.FC = () => {
  return (
    <ScrollReveal variant="fadeUp">
      <div className={styles.wrapper}>
        <section className={styles.section} aria-labelledby="identity-heading">
          <h2 id="identity-heading" className={styles.heading}>
            Built for People Who Take Learning Seriously
          </h2>
          <ul className={styles.identityList}>
            {identityItems.map((item, index) => (
              <li key={index} className={styles.identityItem}>
                <span className={styles.checkmark} aria-hidden>✔</span>
                <span className={styles.identityText}>{item}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </ScrollReveal>
  );
};

IdentitySection.displayName = 'IdentitySection';
