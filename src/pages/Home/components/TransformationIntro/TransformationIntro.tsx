import React from 'react';
import { ScrollReveal } from '@/shared/components/ScrollReveal';
import styles from './TransformationIntro.module.css';

/**
 * TransformationIntro - Standalone tagline block outside How Xplaino Works
 *
 * @returns JSX element
 */
export const TransformationIntro: React.FC = () => {
  return (
    <ScrollReveal variant="fadeUp">
      <div className={styles.wrapper}>
        <p className={styles.title}>From Passive Reading to Active Understanding</p>
        <p className={styles.sub}>Reading the web shouldn't feel chaotic. Xplaino turns every page into clarity.</p>
      </div>
    </ScrollReveal>
  );
};

TransformationIntro.displayName = 'TransformationIntro';
