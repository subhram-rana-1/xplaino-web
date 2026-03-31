import React from 'react';
import {
  StickyNote, Languages, FileType2, Bot,
  Highlighter, Globe, MessageSquare, LayoutGrid,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { ScrollReveal } from '@/shared/components/ScrollReveal';
import styles from './ProblemSection.module.css';

interface CardItem {
  problemLabel: string;
  problemIcon: LucideIcon;
  problem: string;
  solutionIcon: LucideIcon;
  solution: string;
}

const cards: CardItem[] = [
  {
    problemLabel: 'Scattered Notes',
    problemIcon: StickyNote,
    problem: 'You save important content in paper notes or separate apps — losing context every time.',
    solutionIcon: Highlighter,
    solution: 'Highlight and annotate directly on any webpage. Your notes persist and are always there when you return.',
  },
  {
    problemLabel: 'Language Barrier',
    problemIcon: Languages,
    problem: 'You leave articles to translate elsewhere, then switch back — breaking your reading flow.',
    solutionIcon: Globe,
    solution: 'Translate any webpage into 50+ languages. Read in your native language without leaving the page.',
  },
  {
    problemLabel: 'Dense Content',
    problemIcon: FileType2,
    problem: 'Research papers and long articles feel dense, overwhelming, and slow to process.',
    solutionIcon: MessageSquare,
    solution: 'Ask any webpage or PDF a question directly. Get precise answers with source citations.',
  },
  {
    problemLabel: 'Unorganized Learning',
    problemIcon: Bot,
    problem: 'AI sidebars answer questions but never organize your learnings to revisit later.',
    solutionIcon: LayoutGrid,
    solution: 'Track all your bookmarks — webpages, passages, images, words — in one organized dashboard.',
  },
];

/**
 * ProblemSection - "The Modern Learning Problem" section showing pain points and Xplaino solutions
 */
export const ProblemSection: React.FC = () => {
  return (
    <ScrollReveal variant="fadeUp">
      <div className={styles.wrapper}>
        <section className={styles.section} aria-labelledby="problem-heading">
          <h2 id="problem-heading" className={styles.heading}>
            The Modern Learning Problem
          </h2>
          <div className={styles.cardGrid}>
            {cards.map((item, index) => {
              const ProblemIcon = item.problemIcon;
              const SolutionIcon = item.solutionIcon;
              return (
                <div key={index} className={styles.card}>
                  <div className={styles.cardTop}>
                    <span className={`${styles.label} ${styles.problemLabel}`}>
                      {item.problemLabel}
                    </span>
                    <div className={styles.cardRow}>
                      <span className={`${styles.iconWrap} ${styles.iconProblem}`} aria-hidden>
                        <ProblemIcon />
                      </span>
                      <p className={styles.textProblem}>{item.problem}</p>
                    </div>
                  </div>
                  <div className={styles.divider} aria-hidden />
                  <div className={styles.cardBottom}>
                    <span className={styles.label}>
                      With Xplaino
                    </span>
                    <div className={styles.cardRow}>
                      <span className={`${styles.iconWrap} ${styles.iconSolution}`} aria-hidden>
                        <SolutionIcon />
                      </span>
                      <p className={styles.textSolution}>{item.solution}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <p className={styles.closingLine}>
            The web wasn&apos;t built for deep understanding — <span className={styles.fixHighlight}>Xplaino fixes that.</span>
          </p>
        </section>
      </div>
    </ScrollReveal>
  );
};

ProblemSection.displayName = 'ProblemSection';
