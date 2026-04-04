import React from 'react';
import { MessageSquare, Highlighter, Globe, Users, Languages, Bookmark } from 'lucide-react';
import styles from './PromoText.module.css';

const FEATURES = [
  { icon: <MessageSquare size={16} />, label: 'Chat with any page or PDF' },
  { icon: <Highlighter size={16} />, label: 'Highlight & add inline notes' },
  { icon: <Globe size={16} />, label: 'Works on Chrome & PDFs' },
  { icon: <Users size={16} />, label: 'Share & Collaborate' },
  { icon: <Languages size={16} />, label: 'Translate in 50+ languages' },
  { icon: <Bookmark size={16} />, label: 'Bookmark manager' },
];

/**
 * PromoText - Promo text section with heading and feature grid
 * 
 * @returns JSX element
 */
export const PromoText: React.FC = () => {
  return (
    <div className={styles.promoText}>
      <h1 className={styles.heading}>
        Turn Information Overload into <span className={styles.headingHighlight}>Organized Intelligence</span>
      </h1>
      <div className={styles.featuresGrid}>
        {FEATURES.map((f) => (
          <div key={f.label} className={styles.featureItem}>
            <span className={styles.featureIcon}>{f.icon}</span>
            <span className={styles.featureLabel}>{f.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

PromoText.displayName = 'PromoText';

