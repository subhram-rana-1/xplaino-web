import React, { Suspense, lazy } from 'react';
import { ScrollReveal } from '@/shared/components/ScrollReveal';
import { Promo } from './components/Promo';
import { TransformationIntro } from './components/TransformationIntro';
import { ChromeButton } from '@/shared/components/ChromeButton';
import styles from './Home.module.css';

const SocialProof = lazy(() => import('./components/SocialProof').then((m) => ({ default: m.SocialProof })));
const ProblemSection = lazy(() => import('./components/ProblemSection').then((m) => ({ default: m.ProblemSection })));
const HowItWorks = lazy(() => import('./components/HowItWorks').then((m) => ({ default: m.HowItWorks })));
const FeatureSet = lazy(() => import('./components/FeatureSet').then((m) => ({ default: m.FeatureSet })));
const PositioningSection = lazy(() => import('./components/Positioning').then((m) => ({ default: m.PositioningSection })));
const UseCase = lazy(() => import('./components/UseCase').then((m) => ({ default: m.UseCase })));
const IdentitySection = lazy(() => import('./components/IdentitySection').then((m) => ({ default: m.IdentitySection })));
const SupportedLanguages = lazy(() => import('./components/SupportedLanguages').then((m) => ({ default: m.SupportedLanguages })));
const Support = lazy(() => import('./components/Support').then((m) => ({ default: m.Support })));
const QuoteTestimonials = lazy(() => import('./components/QuoteTestimonials').then((m) => ({ default: m.QuoteTestimonials })));

/**
 * Home - Home page component
 * 
 * @returns JSX element
 */
export const Home: React.FC = () => {
  return (
    <div className={styles.home}>
      <Promo />
      <Suspense fallback={null}>
        <SocialProof />
      </Suspense>
      <Suspense fallback={null}>
        <ProblemSection />
      </Suspense>
      <Suspense fallback={null}>
        <HowItWorks />
      </Suspense>
      <TransformationIntro />
      <Suspense fallback={null}>
        <FeatureSet />
      </Suspense>
      <Suspense fallback={null}>
        <QuoteTestimonials />
      </Suspense>
      <Suspense fallback={null}>
        <PositioningSection />
      </Suspense>
      <Suspense fallback={null}>
        <IdentitySection />
      </Suspense>
      <Suspense fallback={null}>
        <UseCase />
      </Suspense>
      <Suspense fallback={null}>
        <SupportedLanguages />
      </Suspense>
      <Suspense fallback={null}>
        <Support />
      </Suspense>
      <ScrollReveal variant="fadeUp">
        <div className={styles.ctaWrapper}>
          <div className={styles.chromeButtonContainer}>
            <h2 className={styles.ctaHeading}>Build Your Second Brain While You Browse</h2>
            <p className={styles.ctaSubtext}>Get AI-powered summaries, translations, and structured knowledge storage — all inside your browser. Install Xplaino AI and transform how you learn online.</p>
            <ChromeButton stackedLabel />
          </div>
        </div>
      </ScrollReveal>
    </div>
  );
};

Home.displayName = 'Home';
