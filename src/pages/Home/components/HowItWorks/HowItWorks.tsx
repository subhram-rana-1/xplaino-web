import React, { useState, useEffect } from 'react';
import { ScrollReveal } from '@/shared/components/ScrollReveal';
import styles from './HowItWorks.module.css';

const steps = [
  { number: '01', title: 'Browse normally', description: 'Read any article, research paper, blog, or website as you usually do.' },
  { number: '02', title: 'Open Xplaino instantly', description: 'Click the extension on any page to activate AI-powered analysis.' },
  { number: '03', title: 'Get structured insights', description: 'Receive summaries, translations, explanations, and organized knowledge — instantly.' },
];

const PHASE_DURATIONS = [700, 850, 850, 400];
const PHASE_COUNT = 4;

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width={20}
      height={20}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M7 4l6 6-6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * HowItWorks - Minimal "How Xplaino Works" 3-step clarity section
 *
 * @returns JSX element
 */
export const HowItWorks: React.FC = () => {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => {
      setPhase((p) => (p + 1) % PHASE_COUNT);
    }, PHASE_DURATIONS[phase]);
    return () => clearTimeout(t);
  }, [phase]);

  const activeStep = phase === 0 ? 0 : phase === 1 ? 1 : phase === 2 ? 2 : null;
  const activeArrow = phase === 1 ? 0 : phase === 2 ? 1 : null;

  return (
    <ScrollReveal variant="fadeUp">
      <div className={styles.wrapper}>
        <section className={styles.section} aria-labelledby="how-it-works-heading">
          <h2 id="how-it-works-heading" className={styles.heading}>
            How Xplaino Works
          </h2>
          <p className={styles.subheading}>
            Turn any webpage into structured knowledge in three simple steps.
          </p>
          <div className={styles.stepsGrid}>
            {steps.map((step, index) => (
              <React.Fragment key={index}>
                <div
                  className={`${styles.step} ${activeStep === index ? styles.stepActive : ''}`}
                >
                  <span className={styles.stepNumber}>{step.number}</span>
                  <h3 className={styles.stepTitle}>{step.title}</h3>
                  <p className={styles.stepDescription}>{step.description}</p>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`${styles.stepArrow} ${activeArrow === index ? styles.arrowActive : ''}`}
                    aria-hidden
                  >
                    <ChevronIcon className={styles.chevron} />
                    <ChevronIcon className={`${styles.chevron} ${styles.chevron2}`} />
                    <ChevronIcon className={`${styles.chevron} ${styles.chevron3}`} />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
          <p className={styles.frictionLine}>
            No new workflow. No tab switching. Just smarter browsing.
          </p>
        </section>
      </div>
    </ScrollReveal>
  );
};

HowItWorks.displayName = 'HowItWorks';
