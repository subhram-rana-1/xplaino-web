import React, { useState, useEffect } from 'react';
import { FileText, Sparkles, BookOpen, Zap, Brain, Search, Layers, Star } from 'lucide-react';
import styles from './PdfLoadingScreen.module.css';

const LOADING_MESSAGES = [
  'Fetching your document…',
  'Preparing pages for reading…',
  'Setting up AI insights…',
  'Optimising text layers…',
  'Loading annotations…',
  'Calibrating highlights…',
  'Almost there…',
  'Powering up smart search…',
];

const ORBIT_ICONS = [
  { Icon: Sparkles, label: 'AI', delay: 0 },
  { Icon: BookOpen, label: 'Read', delay: 0.5 },
  { Icon: Zap, label: 'Fast', delay: 1 },
  { Icon: Brain, label: 'Smart', delay: 1.5 },
  { Icon: Search, label: 'Search', delay: 2 },
  { Icon: Layers, label: 'Layers', delay: 2.5 },
  { Icon: Star, label: 'Highlights', delay: 3 },
];

const MESSAGE_INTERVAL_MS = 2000;

export const PdfLoadingScreen: React.FC = () => {
  const [messageIndex, setMessageIndex] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setMessageIndex(prev => (prev + 1) % LOADING_MESSAGES.length);
        setFade(true);
      }, 300);
    }, MESSAGE_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={styles.container}>
      {/* Subtle radial background glow */}
      <div className={styles.bgGlow} />

      {/* Orbiting ring */}
      <div className={styles.orbitRing}>
        {ORBIT_ICONS.map(({ Icon, label, delay }, i) => {
          const angle = (360 / ORBIT_ICONS.length) * i;
          return (
            <div
              key={label}
              className={styles.orbitItem}
              style={{
                '--orbit-angle': `${angle}deg`,
                '--orbit-delay': `${delay}s`,
              } as React.CSSProperties}
            >
              <div className={styles.iconBubble}>
                <Icon size={16} />
              </div>
            </div>
          );
        })}

        {/* Centre document icon */}
        <div className={styles.centreIcon}>
          <FileText size={32} />
          <div className={styles.pulse} />
        </div>
      </div>

      {/* Animated progress dots */}
      <div className={styles.dotsRow}>
        {[0, 1, 2, 3].map(i => (
          <span key={i} className={styles.dot} style={{ '--dot-delay': `${i * 0.18}s` } as React.CSSProperties} />
        ))}
      </div>

      {/* Rotating text message */}
      <p className={`${styles.message} ${fade ? styles.messageVisible : styles.messageHidden}`}>
        {LOADING_MESSAGES[messageIndex]}
      </p>

      {/* Thin progress bar */}
      <div className={styles.progressTrack}>
        <div className={styles.progressBar} />
      </div>
    </div>
  );
};
