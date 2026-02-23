import React from 'react';
import { ScrollReveal } from '@/shared/components/ScrollReveal';
import styles from './HowItWorks.module.css';

const steps = [
  {
    number: '01',
    title: 'Browse normally',
    description: 'Read any article, research paper, blog, or website as you usually do.',
  },
  {
    number: '02',
    title: 'Open Xplaino instantly',
    description: 'Click the extension on any page to activate AI-powered analysis.',
  },
  {
    number: '03',
    title: 'Get structured insights',
    description: 'Receive summaries, translations, explanations, and organized knowledge — instantly.',
  },
];

/**
 * HowItWorks - Minimal "How Xplaino Works" 3-step clarity section
 *
 * @returns JSX element
 */
export const HowItWorks: React.FC = () => {
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
                <div className={styles.step}>
                  <span className={styles.stepNumber}>{step.number}</span>
                  <h3 className={styles.stepTitle}>{step.title}</h3>
                  <p className={styles.stepDescription}>{step.description}</p>
                </div>
                {index < steps.length - 1 && (
                  <div className={styles.stepArrow} aria-hidden>
                    <img
                      src="https://bmicorrect.com/website/how-xplaino-works/images/arrow.webp"
                      alt=""
                      className={styles.arrowIcon}
                      width={32}
                      height={32}
                      loading="lazy"
                    />
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
