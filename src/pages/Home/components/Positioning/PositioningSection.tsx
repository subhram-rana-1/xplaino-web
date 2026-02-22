import React from 'react';
import { FiX } from 'react-icons/fi';
import { ScrollReveal } from '@/shared/components/ScrollReveal';
import styles from './PositioningSection.module.css';

const extensionsProblems = [
  'Wait for prompts',
  'Forget context',
  "Don't organize anything",
  "Don't build long-term knowledge",
];

const xplainoBenefits = [
  'Understands the page',
  'Structures information',
  'Stores insights',
  'Builds your personal knowledge base',
];

/**
 * PositioningSection - Category differentiation (not another AI chat popup)
 *
 * @returns JSX element
 */
export const PositioningSection: React.FC = () => {
  return (
    <ScrollReveal variant="fadeUp">
      <div className={styles.wrapper}>
        <section className={styles.section}>
          <h2 className={styles.heading}>Not Another AI Chat Popup</h2>
          <div className={styles.compareGrid}>
            <div className={styles.column}>
              <p className={styles.columnLabel}>Most AI extensions:</p>
              <ul className={styles.problemList}>
                {extensionsProblems.map((item, index) => (
                  <li key={index} className={styles.problemItem}>
                    <span className={styles.crossIcon} aria-hidden>
                      <FiX />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className={styles.xplainoColumn}>
              <p className={`${styles.columnLabel} ${styles.columnLabelXplaino}`}>Xplaino:</p>
              <ul className={styles.benefitList}>
                {xplainoBenefits.map((item, index) => (
                  <li key={index} className={styles.benefitItem}>
                    <span className={styles.checkmark} aria-hidden>✔</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <p className={styles.closing}>This is AI for serious learners — not casual chatting.</p>
        </section>
      </div>
    </ScrollReveal>
  );
};

PositioningSection.displayName = 'PositioningSection';
