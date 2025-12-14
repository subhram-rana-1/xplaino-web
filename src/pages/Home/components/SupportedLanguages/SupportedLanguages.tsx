import React from 'react';
import styles from './SupportedLanguages.module.css';

/**
 * SupportedLanguages - Supported Languages section with scrolling flags
 * 
 * @returns JSX element
 */
export const SupportedLanguages: React.FC = () => {
  const languages = [
    { code: 'US', name: 'English', flag: '🇺🇸' },
    { code: 'ES', name: 'Spanish', flag: '🇪🇸' },
    { code: 'FR', name: 'French', flag: '🇫🇷' },
    { code: 'DE', name: 'German', flag: '🇩🇪' },
    { code: 'IT', name: 'Italian', flag: '🇮🇹' },
    { code: 'PT', name: 'Portuguese', flag: '🇵🇹' },
    { code: 'RU', name: 'Russian', flag: '🇷🇺' },
    { code: 'CN', name: 'Chinese', flag: '🇨🇳' },
    { code: 'JP', name: 'Japanese', flag: '🇯🇵' },
    { code: 'KR', name: 'Korean', flag: '🇰🇷' },
    { code: 'AR', name: 'Arabic', flag: '🇸🇦' },
    { code: 'IN', name: 'Hindi', flag: '🇮🇳' },
    { code: 'NL', name: 'Dutch', flag: '🇳🇱' },
    { code: 'PL', name: 'Polish', flag: '🇵🇱' },
    { code: 'TR', name: 'Turkish', flag: '🇹🇷' },
    { code: 'SE', name: 'Swedish', flag: '🇸🇪' },
    { code: 'NO', name: 'Norwegian', flag: '🇳🇴' },
    { code: 'DK', name: 'Danish', flag: '🇩🇰' },
    { code: 'FI', name: 'Finnish', flag: '🇫🇮' },
    { code: 'GR', name: 'Greek', flag: '🇬🇷' },
    { code: 'CZ', name: 'Czech', flag: '🇨🇿' },
    { code: 'HU', name: 'Hungarian', flag: '🇭🇺' },
    { code: 'RO', name: 'Romanian', flag: '🇷🇴' },
    { code: 'TH', name: 'Thai', flag: '🇹🇭' },
    { code: 'VI', name: 'Vietnamese', flag: '🇻🇳' },
    { code: 'ID', name: 'Indonesian', flag: '🇮🇩' },
    { code: 'MY', name: 'Malay', flag: '🇲🇾' },
    { code: 'PH', name: 'Filipino', flag: '🇵🇭' },
    { code: 'HE', name: 'Hebrew', flag: '🇮🇱' },
    { code: 'UK', name: 'Ukrainian', flag: '🇺🇦' },
  ];

  return (
    <section className={styles.supportedLanguages}>
      <h2 className={styles.heading}>Supported Languages</h2>
      <div className={styles.scrollingContainer}>
        <div className={styles.scrollingContent}>
          {languages.map((language, index) => (
            <span key={index} className={styles.languageItem}>
              <span className={styles.flag}>{language.flag}</span>
              <span className={styles.languageName}>{language.name}</span>
            </span>
          ))}
          {/* Duplicate for seamless loop */}
          {languages.map((language, index) => (
            <span key={`duplicate-${index}`} className={styles.languageItem}>
              <span className={styles.flag}>{language.flag}</span>
              <span className={styles.languageName}>{language.name}</span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
};

SupportedLanguages.displayName = 'SupportedLanguages';

