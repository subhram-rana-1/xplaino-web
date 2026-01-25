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
      title: 'Summarise page', 
      videoUrl: 'https://static-web.maxai.photos/videos/landing/homepage-v3/primary.mp4?t=1',
      bullets: [
        'Quickly understand the main points of any webpage',
        'Save time by getting instant summaries',
        'Focus on what matters most'
      ]
    },
    { 
      id: 2, 
      title: 'Dont forget while you read further', 
      videoUrl: 'https://static-web.maxai.photos/videos/landing/homepage-v3/primary.mp4?t=1',
      bullets: [
        'Keep important information at your fingertips',
        'Never lose track of key details',
        'Seamless reading experience'
      ]
    },
    { 
      id: 3, 
      title: 'Explain paragraph', 
      videoUrl: 'https://static-web.maxai.photos/videos/landing/homepage-v3/primary.mp4?t=1',
      bullets: [
        'Get detailed explanations of complex paragraphs',
        'Understand context and meaning',
        'Enhance your comprehension'
      ]
    },
    { 
      id: 4, 
      title: 'Get related questions', 
      videoUrl: 'https://static-web.maxai.photos/videos/landing/homepage-v3/primary.mp4?t=1',
      bullets: [
        'Explore topics with related questions',
        'Deepen your understanding',
        'Discover new insights'
      ]
    },
    { 
      id: 5, 
      title: 'Explore a word in depth', 
      videoUrl: 'https://static-web.maxai.photos/videos/landing/homepage-v3/primary.mp4?t=1',
      bullets: [
        'Learn definitions and usage',
        'Understand word context',
        'Expand your vocabulary'
      ]
    },
    { 
      id: 6, 
      title: 'Do not forget where you have read', 
      videoUrl: 'https://static-web.maxai.photos/videos/landing/homepage-v3/primary.mp4?t=1',
      bullets: [
        'Track your reading history',
        'Remember important sources',
        'Organize your knowledge'
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

