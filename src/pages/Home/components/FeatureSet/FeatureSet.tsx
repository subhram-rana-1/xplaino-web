import React from 'react';
import { ScrollReveal } from '@/shared/components/ScrollReveal';
import { FeatureContainer } from './FeatureContainer';
import styles from './FeatureSet.module.css';

/**
 * FeatureSet - Feature set section with compact feature cards in responsive grid
 * 
 * @returns JSX element
 */
export const FeatureSet: React.FC = () => {
  const features = [
    {
      id: 1,
      icon: '⚡',
      title: 'Structured Article & Research Summaries',
      description: 'Instantly summarize long webpages and online articles with an AI-powered research assistant designed for students, researchers, and professionals.',
      videoUrl: 'https://bmicorrect.com/website/features/videos/summary.webm',
      thumbnailImage: 'https://bmicorrect.com/website/features/images/v3/summary-v3.webp',
      bullets: [
        'Get a concise AI-generated summary of any webpage — skip the fluff and grasp the key points instantly',
        'Each summary point links back to the exact section of the page it came from, so you can dive deeper when needed',
        'Auto-generated follow-up questions help you build context faster without guessing what to ask',
        'Save summaries to your dashboard with the original link — revisit anytime and trace back to the source'
      ]
    },
    {
      id: 8,
      icon: '🌐',
      title: 'AI Web Translator (50+ Languages)',
      description: 'Translate entire webpages instantly into your preferred language and read international research, blogs, and academic content effortlessly.',
      videoUrl: 'https://bmicorrect.com/website/features/videos/translate.webm',
      thumbnailImage: 'https://bmicorrect.com/website/features/images/v3/translate-v3.webp',
      bullets: [
        'Translate any webpage into your preferred language in seconds — no copy-pasting, no extra tabs',
        'Replace the original content seamlessly so the page feels like it was written in your native language',
        'Or view translations side-by-side with the original text for easy comparison and learning',
        'Toggle translations on or off anytime — switch between views with a single click'
      ]
    },
    {
      id: 3,
      icon: '📝',
      title: 'Context-Aware AI Research Assistant',
      description: 'Select any text and get contextual AI explanations, simplifications, and translations to deeply understand complex academic or technical content.',
      videoUrl: 'https://bmicorrect.com/website/features/videos/ask-ai.webm',
      thumbnailImage: 'https://bmicorrect.com/website/features/images/v3/ask-ai-v3.webp',
      bullets: [
        'Select any text or paragraph and get AI-powered contextual explanations — ask follow-up questions to dive deeper',
        'Translate selections to your native language or any language you choose',
        'Bookmark important passages to your dashboard and summarize all your saved content with one click',
        'Trace back to the source webpage instantly from your saved text'
      ]
    },
    {
      id: 7,
      icon: '📖',
      title: 'AI Vocabulary Assistant – Master Any Word Instantly',
      description: 'Understand new words in context with AI-powered explanations, examples, synonyms, antonyms, and instant translation while browsing.',
      videoUrl: 'https://bmicorrect.com/website/features/videos/word.webm',
      thumbnailImage: 'https://bmicorrect.com/website/features/images/v3/words-v3.webp',
      bullets: [
        'Get contextual explanations with real examples, synonyms, antonyms, and instant translation to your native language',
        'Ask follow-up questions about the word — in context or in general — with built-in smart prompts for detailed, clear answers',
        'Save words to your personal dashboard and track your vocabulary growth over time',
        'Jump back to the original webpage where you discovered the word with one click'
      ]
    },
    {
      id: 5,
      icon: '🖼️',
      title: 'AI Image Explainer – Understand Diagrams, Charts & Infographics',
      description: 'Click on any image to get instant AI-powered explanations and explore diagrams, charts, and visual content in depth.',
      videoUrl: 'https://bmicorrect.com/website/features/videos/image.webm',
      thumbnailImage: 'https://bmicorrect.com/website/features/images/v3/image-v3.webp',
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
      title: 'Personal Knowledge Dashboard',
      description: 'Highlight text, save summaries, store links, and organize insights automatically while browsing — build your personal knowledge hub.',
      videoUrl: 'https://bmicorrect.com/website/features/videos/bookmark.webm',
      thumbnailImage: 'https://bmicorrect.com/website/features/images/v3/bookmark-v3.webp',
      bullets: [
        'Stop juggling bookmarks across YouTube, Twitter, articles, and other platforms — save everything to one unified dashboard',
        'No more switching tabs or hunting through different apps to find what you saved — it\'s all here',
        'Organize words, passages, images, videos, and summaries in one powerful hub you fully control',
        'Every saved item links back to its source, so you can jump to the original content in one click'
      ]
    },
    {
      id: 4,
      icon: '🔄',
      title: 'Revisit Previous AI Explanations & Conversations Anytime',
      description: 'All your AI explanations, summaries, translations, and interactions remain accessible so you can continue learning without losing context.',
      videoUrl: 'https://bmicorrect.com/website/features/videos/persistence.webm',
      thumbnailImage: 'https://bmicorrect.com/website/features/images/v3/persistance-v3.webp',
      bullets: [
        'All AI explanations for words, text, images, summaries, and translations are stored right in the UI',
        'Previous conversations stay intact while you explore new topics'
      ]
    },
    {
      id: 9,
      icon: '🎨',
      title: 'Custom Light & Dark Themes for Every Website',
      description: 'Switch between light and dark themes individually for each website to optimize your reading and browsing experience.',
      videoUrl: 'https://bmicorrect.com/website/features/videos/theme.webm',
      thumbnailImage: 'https://bmicorrect.com/website/features/images/v3/theme-v4.webp',
      bullets: [
        'You can set Light or Dark theme individually for each website',
        'Switch between websites without toggling themes manually'
      ]
    }
  ];

  return (
    <div className={styles.featureSetWrapper}>
      <section className={styles.featureSet}>
        <div className={styles.headingRow}>
          <h2 className={styles.subheading}>What you can do today</h2>
          <div className={styles.comingSoonTeaser} aria-label="Upcoming features">
            <span className={styles.comingSoonBadge}>Coming Soon !</span>
            <span className={styles.comingSoonText}>
              Summarise any PDF & chat with your documents — Few days to launch.
            </span>
          </div>
        </div>
        <div className={styles.containerList}>
          {features.map((feature, index) => (
            <ScrollReveal key={feature.id} variant="fadeUp" delay={index * 80}>
              <FeatureContainer
                icon={feature.icon}
                title={feature.title}
                videoUrl={feature.videoUrl}
                bullets={feature.bullets}
                thumbnailImage={(feature as any).thumbnailImage}
              />
            </ScrollReveal>
          ))}
        </div>
      </section>
    </div>
  );
};

FeatureSet.displayName = 'FeatureSet';

