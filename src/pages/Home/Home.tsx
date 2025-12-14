import React from 'react';
import { Promo } from './components/Promo';
import { UseCase } from './components/UseCase';
import { FeatureSet } from './components/FeatureSet';
import { SupportedLanguages } from './components/SupportedLanguages';
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
      <div className={styles.chromeButtonContainer}>
        <ChromeButton />
      </div>
    </div>
  );
};

Home.displayName = 'Home';
