import React from 'react';
import { Promo } from './components/Promo';
import { UseCase } from './components/UseCase';
import { FeatureSet } from './components/FeatureSet';
import { SupportedLanguages } from './components/SupportedLanguages';
import { Support } from './components/Support';
import { ChromeButton } from '@/shared/components/ChromeButton';
import styles from './Home.module.css';

/**
 * Home - Home page component
 * 
 * @returns JSX element
 */
export const Home: React.FC = () => {
  return (
    <div className={styles.home}>
      <Promo />
      <FeatureSet />
      <UseCase />
      <SupportedLanguages />
      <Support />
      <div className={styles.chromeButtonContainer}>
        <h2 className={styles.ctaHeading}>Ready to learn faster?</h2>
        <p className={styles.ctaSubtext}>Start browsing smarter with AI-powered insights — it only takes a few seconds to get started.</p>
        <ChromeButton />
        <p className={styles.trustBadge}>
          <span className={styles.trustIcon}>✨</span>
          Join thousands of curious minds
        </p>
      </div>
    </div>
  );
};

Home.displayName = 'Home';
