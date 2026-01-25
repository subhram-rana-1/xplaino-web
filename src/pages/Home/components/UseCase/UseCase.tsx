import React from 'react';
import styles from './UseCase.module.css';

/**
 * UseCase - Use case section with scrolling text
 * 
 * @returns JSX element
 */
export const UseCase: React.FC = () => {
  const useCases = [
    'Language learning',
    'Research',
    'Marketing',
    'Data Analysis',
    'Productivity',
    'Translation',
  ];

  return (
    <section className={styles.useCase}>
      <h2 className={styles.heading}>Use Cases</h2>
      <p className={styles.subheading}>Built for every workflow</p>
      <div className={styles.scrollingContainer}>
        <div className={styles.scrollingContent}>
          {useCases.map((useCase, index) => (
            <span key={index} className={styles.useCaseItem}>
              {useCase}
            </span>
          ))}
          {/* Duplicate for seamless loop */}
          {useCases.map((useCase, index) => (
            <span key={`duplicate-${index}`} className={styles.useCaseItem}>
              {useCase}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
};

UseCase.displayName = 'UseCase';




