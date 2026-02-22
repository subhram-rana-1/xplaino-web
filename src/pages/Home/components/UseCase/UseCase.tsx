import React from 'react';
import { ScrollReveal } from '@/shared/components/ScrollReveal';
import styles from './UseCase.module.css';

const useCases = [
  {
    title: 'For Students & Competitive Exams',
    description: 'Summarize study material, simplify concepts, and store structured notes.',
  },
  {
    title: 'For Researchers & Academics',
    description: 'Summarize research papers and interact with academic content instantly.',
  },
  {
    title: 'For Professionals',
    description: 'Understand industry reports faster and retain key insights.',
  },
  {
    title: 'For Language Learners',
    description: 'Translate and understand foreign-language content in real time.',
  },
];

/**
 * UseCase - Use case section with SEO-rich audience blocks
 *
 * @returns JSX element
 */
export const UseCase: React.FC = () => {
  return (
    <ScrollReveal variant="fadeLeft">
      <div className={styles.useCaseWrapper}>
        <section className={styles.useCase}>
          <h2 className={styles.subheading}>Use cases</h2>
          <div className={styles.useCaseGrid}>
            {useCases.map((item, index) => (
              <div key={index} className={styles.useCaseCard}>
                <h3 className={styles.useCaseCardTitle}>{item.title}</h3>
                <p className={styles.useCaseCardDescription}>{item.description}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </ScrollReveal>
  );
};

UseCase.displayName = 'UseCase';
