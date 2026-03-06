import React from 'react';
import { BookOpen, FileText, Bookmark, MessageCircle } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { ScrollReveal } from '@/shared/components/ScrollReveal';
import styles from './ProblemSection.module.css';

const problemItems: { icon: LucideIcon; text: string }[] = [
  { icon: BookOpen, text: 'You read dozens of articles — but retain very little.' },
  { icon: FileText, text: 'Research papers feel dense, overwhelming, and slow.' },
  { icon: Bookmark, text: 'Important insights disappear into bookmarks.' },
  { icon: MessageCircle, text: 'AI chat tools give answers — but don\'t build knowledge.' },
];

/**
 * ProblemSection - "The Modern Learning Problem" section for emotional recognition
 *
 * @returns JSX element
 */
export const ProblemSection: React.FC = () => {
  return (
    <ScrollReveal variant="fadeUp">
      <div className={styles.wrapper}>
        <section className={styles.section} aria-labelledby="problem-heading">
          <h2 id="problem-heading" className={styles.heading}>
            {/* <span className={styles.headingIcon} aria-hidden>🧠</span> */}
            The Modern Learning Problem
          </h2>
          <ul className={styles.problemList}>
            {problemItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <li key={index} className={styles.problemItem}>
                  <span className={styles.pointIconWrapper} aria-hidden>
                    <span className={styles.pointIcon}>
                      <Icon />
                    </span>
                  </span>
                  <p className={styles.pointText}>{item.text}</p>
                </li>
              );
            })}
          </ul>
          <p className={styles.closingLine}>The web wasn&apos;t built for deep understanding.</p>
          <p className={styles.fixLine}>Xplaino fixes that.</p>
        </section>
      </div>
    </ScrollReveal>
  );
};

ProblemSection.displayName = 'ProblemSection';
