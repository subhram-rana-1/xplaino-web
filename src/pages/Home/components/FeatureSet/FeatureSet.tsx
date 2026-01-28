import React from 'react';
import { FeatureContainer } from './FeatureContainer';
import styles from './FeatureSet.module.css';

/**
 * FeatureSet - Feature set section with compact feature cards in responsive grid
 * 
 * @returns JSX element
 */
export const FeatureSet: React.FC = () => {
  // Placeholder data - will be replaced with actual data
  const features = [
    {
      id: 1,
      icon: '⚡',
      title: 'Summarize any webpage in seconds',
      videoUrl: 'https://www.youtube.com/embed/fZeNDBk2AyQ',
      bullets: [
        'Get a concise AI-generated summary of any webpage — skip the fluff and grasp the key points instantly',
        'Each summary point links back to the exact section of the page it came from, so you can dive deeper when needed',
        'Auto-generated follow-up questions help you build context faster without guessing what to ask',
        'Save summaries to your dashboard with the original link — revisit anytime and trace back to the source'
      ]
    },
    {
        id: 2,
        icon: '🌍',
        title: 'Get explanations in Your Language',
        videoUrl: 'https://www.youtube.com/embed/PBmcNg_oRxs',
        bullets: [
            'Set your language once, works everywhere automatically',
            'Switch languages anytime from settings'
        ]
    },
    {
      id: 3,
      icon: '📝',
      title: 'Understand any text in depth instantly',
      videoUrl: 'https://www.youtube.com/embed/CPBM3p1e_Ts',
      bullets: [
        'Select any text or paragraph and get AI-powered contextual explanations — ask follow-up questions to dive deeper',
        'Translate selections to your native language or any language you choose',
        'Bookmark important passages to your dashboard and summarize all your saved content with one click',
        'Trace back to the source webpage instantly from your saved text'
      ]
    },
    {
      id: 4,
      icon: '🔄',
      title: 'Revisit what you just learned',
      videoUrl: 'https://www.youtube.com/embed/u94PB_SjPg8',
      bullets: [
        'All AI explanations for words, text, images, summaries, and translations are stored right in the UI',
        'Previous conversations stay intact while you explore new topics'
      ]
    },
    {
      id: 5,
      icon: '🖼️',
      title: 'Decode any image with AI',
      videoUrl: 'https://www.youtube.com/embed/yHe7_MsaUy0',
      bullets: [
        'Click on any image and get instant AI-powered explanations — understand diagrams, charts, infographics, and more',
        'Ask follow-up questions to explore details, context, or anything you\'re curious about',
        'Save images to your dashboard for quick reference and revisit your visual learning anytime',
        'Navigate back to the original webpage where you found the image in one click'
      ]
    },
    {
      id: 6,
      icon: '🗂️',
      title: 'One place for all your bookmarks',
      videoUrl: 'https://www.youtube.com/embed/_L9jWcIl__s',
      bullets: [
        'Stop juggling bookmarks across YouTube, Twitter, articles, and other platforms — save everything to one unified dashboard',
        'No more switching tabs or hunting through different apps to find what you saved — it\'s all here',
        'Organize words, passages, images, videos, and summaries in one powerful hub you fully control',
        'Every saved item links back to its source, so you can jump to the original content in one click'
      ]
    },
    {
      id: 7,
      icon: '📖',
      title: 'Master any word with one click',
      videoUrl: 'https://www.youtube.com/embed/cJxWhUKk9rc',
      bullets: [
        'Get contextual explanations with real examples, synonyms, antonyms, and instant translation to your native language',
        'Ask follow-up questions about the word — in context or in general — with built-in smart prompts for detailed, clear answers',
        'Save words to your personal dashboard and track your vocabulary growth over time',
        'Jump back to the original webpage where you discovered the word with one click'
      ]
    },
    {
      id: 8,
      icon: '🌐',
      title: 'Translate entire webpages instantly',
      videoUrl: 'https://www.youtube.com/embed/ij5XBehuq7A',
      bullets: [
        'Translate any webpage into your preferred language in seconds — no copy-pasting, no extra tabs',
        'Replace the original content seamlessly so the page feels like it was written in your native language',
        'Or view translations side-by-side with the original text for easy comparison and learning',
        'Toggle translations on or off anytime — switch between views with a single click'
      ]
    },
    { 
      id: 9,
      icon: '🎨',
      title: 'Different themes for different websites', 
      videoUrl: 'https://www.youtube.com/embed/ZOpLJsZlb3U',
      bullets: [
        'You can set Light or Dark theme individually for each website',
        'Switch between websites without toggling themes manually'
      ]
    },
  ];

  return (
    <div className={styles.featureSetWrapper}>
      <section className={styles.featureSet}>
        <h2 className={styles.subheading}>Key Features</h2>
        <div className={styles.containerList}>
          {features.map((feature) => (
            <FeatureContainer
              key={feature.id}
              icon={feature.icon}
              title={feature.title}
              videoUrl={feature.videoUrl}
              bullets={feature.bullets}
            />
          ))}
        </div>
      </section>
    </div>
  );
};

FeatureSet.displayName = 'FeatureSet';

