import React from 'react';
import { FeatureContainer } from './FeatureContainer';
import styles from './FeatureSet.module.css';

/**
 * FeatureSet - Feature set section with vertical containers in alternating layout
 * 
 * @returns JSX element
 */
export const FeatureSet: React.FC = () => {
  // Placeholder data - will be replaced with actual data
  const features = [
    { 
      id: 1, 
      title: 'Different themes for different websites', 
      videoUrl: 'https://ik.imagekit.io/subhram/xplaino/website-videos/theme.mp4',
      bullets: [
        'No global theme — set Light or Dark individually for each website',
        'Switch between websites without toggling themes manually'
      ]
    },
    {
      id: 2,
      title: 'Revisit what you just learned',
      videoUrl: 'https://static-web.maxai.photos/videos/landing/homepage-v3/primary.mp4?t=1',
      bullets: [
        'All AI explanations for words, text, images, summaries, and translations are stored right in the UI',
        'Previous conversations stay intact while you explore new topics'
      ]
    },
  ];

  return (
    <section className={styles.featureSet}>
      <h2 className={styles.heading}>Features</h2>
      <p className={styles.subheading}>Everything you need to understand better</p>
      <div className={styles.containerList}>
        {features.map((feature, index) => (
          <FeatureContainer
            key={feature.id}
            title={feature.title}
            videoUrl={feature.videoUrl}
            bullets={feature.bullets}
            isReversed={index % 2 === 1} // Alternate: even index = normal, odd index = reversed
          />
        ))}
      </div>
    </section>
  );
};

FeatureSet.displayName = 'FeatureSet';

