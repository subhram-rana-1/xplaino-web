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
  'Understands the page in seconds',
  'Turns information into structured knowledge',
  'Builds your personal knowledge base automatically',
  'Creates long-term learning memory',
];

/**
 * PositioningSection - Problem → Solution mapping (not another AI chat popup)
 *
 * @returns JSX element
 */
export const PositioningSection: React.FC = () => {
  return (
    <ScrollReveal variant="fadeUp">
      <div className={styles.wrapper}>
        <section className={styles.section} aria-labelledby="positioning-heading">
          <h2 id="positioning-heading" className={styles.heading}>
            Not Just Another AI Chat Extension
          </h2>
          <p className={styles.subheading}>
            The problem with most AI extensions — and how Xplaino solves it.
          </p>
          <div className={styles.compareGrid}>
            <div className={styles.problemCard}>
              <span className={styles.cardBadge} data-badge="problem">
                The problem
              </span>
              <p className={styles.columnLabel}>Most AI extensions</p>
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
            <div className={styles.connector} aria-hidden>
              <span className={styles.connectorArrow}>→</span>
              <span className={styles.connectorLabel}>Xplaino solves this</span>
            </div>
            <div className={styles.solutionCard}>
              <span className={styles.cardBadge} data-badge="solution">
                The solution
              </span>
              <p className={`${styles.columnLabel} ${styles.columnLabelXplaino}`}>
                <img src="https://bmicorrect.com/website/icons/xplaino-brand-teal.png" alt="Xplaino" className={styles.brandIcon} aria-hidden />
              </p>
              <ul className={styles.benefitList}>
                {xplainoBenefits.map((item, index) => (
                  <li key={index} className={styles.benefitItem}>
                    <span className={styles.checkmark} aria-hidden>✔</span>
                    <span className={styles.benefitContent}>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <p className={styles.closing}>
            This is AI for serious learners — not casual chatting.
          </p>
        </section>
      </div>
    </ScrollReveal>
  );
};

PositioningSection.displayName = 'PositioningSection';
