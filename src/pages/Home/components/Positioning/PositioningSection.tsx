import React from 'react';
import { X, Check } from 'lucide-react';
import { ScrollReveal } from '@/shared/components/ScrollReveal';
import styles from './PositioningSection.module.css';

const comparisons = [
  {
    problem: 'Copy-paste text into AI chatbots for answers',
    solution: 'Ask AI directly on any webpage or PDF — zero copy-paste',
  },
  {
    problem: 'Highlights and notes scattered across separate apps',
    solution: 'Highlight, annotate, and save notes right on the page — they persist',
  },
  {
    problem: 'Switch tabs to translate foreign-language content',
    solution: 'Translate any webpage into 50+ languages without leaving',
  },
  {
    problem: 'Nothing tracked — learnings lost after closing the tab',
    solution: 'Personal dashboard organizes every bookmark, note, and highlight with source',
  },
];

/**
 * PositioningSection - 1:1 Problem → Solution comparison rows
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
            See how Xplaino is different — point by point.
          </p>
          <div className={styles.table}>
            <div className={styles.tableHeader}>
              <span className={styles.headerProblem}>Other AI Extensions</span>
              <span className={styles.headerSolution}>With Xplaino</span>
            </div>
            {comparisons.map((item, index) => (
              <div key={index} className={styles.row}>
                <div className={styles.cellProblem}>
                  <span className={styles.crossIcon} aria-hidden>
                    <X />
                  </span>
                  <span>{item.problem}</span>
                </div>
                <div className={styles.cellSolution}>
                  <span className={styles.checkIcon} aria-hidden>
                    <Check />
                  </span>
                  <span>{item.solution}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </ScrollReveal>
  );
};

PositioningSection.displayName = 'PositioningSection';
