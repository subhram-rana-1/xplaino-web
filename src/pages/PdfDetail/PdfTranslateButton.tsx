import React, { useState, useEffect, useRef } from 'react';
import { LanguageDropdown } from '@/pages/UserAccount/components/LanguageDropdown';
import type { LanguageDropdownOption } from '@/pages/UserAccount/components/LanguageDropdown';
import { getAllLanguages } from '@/shared/services/user-settings.service';
import styles from './PdfTranslateButton.module.css';

interface PdfTranslateButtonProps {
  selectedLanguage: string | null;
  onLanguageChange: (code: string | null) => void;
  onTranslate: () => void;
  isTranslating: boolean;
  isTranslated: boolean;
}

/**
 * PdfTranslateButton
 *
 * - Hovering over the button fades in the language selector panel below it.
 * - The panel stays open while the cursor is on the button or the panel itself.
 * - Clicking "Translate PDF" fires onTranslate() (if a language is selected).
 * - No separate Translate button inside the panel — the main button drives translation.
 */
export const PdfTranslateButton: React.FC<PdfTranslateButtonProps> = ({
  selectedLanguage,
  onLanguageChange,
  onTranslate,
  isTranslating,
  isTranslated,
}) => {
  const [languageOptions, setLanguageOptions] = useState<LanguageDropdownOption[]>([]);
  const [isButtonHovered, setIsButtonHovered] = useState(false);
  const [isPanelHovered, setIsPanelHovered] = useState(false);
  // Drives CSS visibility class after mount for fade-in/out
  const [isPanelVisible, setIsPanelVisible] = useState(false);
  // Keeps the panel in the DOM during the fade-out animation
  const [isPanelMounted, setIsPanelMounted] = useState(false);

  // Panel is open whenever either zone is hovered
  const isHovered = isButtonHovered || isPanelHovered;
  // Dimmed only when a language is already selected and cursor is on the button, not yet on the panel
  const isPanelDimmed = selectedLanguage !== null && isButtonHovered && !isPanelHovered;

  const hoverLeaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fadeOutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch language list once
  useEffect(() => {
    getAllLanguages()
      .then((res) => {
        const sorted = [...res.languages].sort((a, b) =>
          a.languageNameInEnglish.localeCompare(b.languageNameInEnglish),
        );
        setLanguageOptions(
          sorted.map((lang) => ({
            value: lang.languageCode,
            label: `${lang.languageNameInEnglish} (${lang.languageNameInNative})`,
          })),
        );
      })
      .catch(() => { /* Language list unavailable */ });
  }, []);

  // Mount/unmount panel with fade animation
  useEffect(() => {
    if (fadeOutTimerRef.current) clearTimeout(fadeOutTimerRef.current);

    if (isHovered) {
      // Mount first, then trigger visible class on next frame for CSS transition to work
      setIsPanelMounted(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setIsPanelVisible(true));
      });
    } else {
      // Fade out, then unmount after animation completes
      setIsPanelVisible(false);
      fadeOutTimerRef.current = setTimeout(() => setIsPanelMounted(false), 220);
    }
  }, [isHovered]);

  useEffect(() => {
    return () => {
      if (hoverLeaveTimerRef.current) clearTimeout(hoverLeaveTimerRef.current);
      if (fadeOutTimerRef.current) clearTimeout(fadeOutTimerRef.current);
    };
  }, []);

  const handleButtonMouseEnter = () => {
    if (hoverLeaveTimerRef.current) clearTimeout(hoverLeaveTimerRef.current);
    setIsButtonHovered(true);
  };

  const handleButtonMouseLeave = () => {
    hoverLeaveTimerRef.current = setTimeout(() => setIsButtonHovered(false), 120);
  };

  const handlePanelMouseEnter = () => {
    if (hoverLeaveTimerRef.current) clearTimeout(hoverLeaveTimerRef.current);
    setIsPanelHovered(true);
  };

  const handlePanelMouseLeave = () => {
    hoverLeaveTimerRef.current = setTimeout(() => {
      setIsPanelHovered(false);
      setIsButtonHovered(false);
    }, 120);
  };

  const handleButtonClick = () => {
    if (isTranslating) return;
    if (selectedLanguage) {
      setIsButtonHovered(false);
      setIsPanelHovered(false);
      onTranslate();
    }
    // If no language: panel is already visible on hover showing the hint + dropdown
  };

  return (
    <div className={styles.container}>
      {/* ── Main button ── */}
      <button
        type="button"
        className={`${styles.translateBtn} ${isTranslating ? styles.translating : ''} ${isTranslated ? styles.translated : ''}`}
        onMouseEnter={handleButtonMouseEnter}
        onMouseLeave={handleButtonMouseLeave}
        onClick={handleButtonClick}
        disabled={isTranslating}
        aria-label={isTranslating ? 'Translating PDF…' : 'Translate PDF'}
      >
        {isTranslating ? (
          <>
            <span className={styles.spinner} aria-hidden="true" />
            <span>Translating…</span>
          </>
        ) : isTranslated ? (
          <>
            <span className={styles.checkmark} aria-hidden="true">✓</span>
            <span>Translated</span>
          </>
        ) : (
          <>
            <TranslateIcon />
            <span>Translate PDF</span>
          </>
        )}
      </button>

      {/* ── Language selector panel (hover-driven) ── */}
      {isPanelMounted && (
        <div
          className={[
            styles.panel,
            isPanelVisible ? styles.panelVisible : styles.panelHidden,
            isPanelDimmed ? styles.panelDimmed : '',
          ].join(' ')}
          onMouseEnter={handlePanelMouseEnter}
          onMouseLeave={handlePanelMouseLeave}
        >
          <p className={styles.panelTitle}>Translate to</p>
          {!selectedLanguage && (
            <p className={styles.noLangHint}>Select your native language</p>
          )}
          <LanguageDropdown
            options={languageOptions}
            value={selectedLanguage}
            onChange={onLanguageChange}
            placeholder="Select language"
          />
        </div>
      )}
    </div>
  );
};

function TranslateIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      {/* Material Design "Translate" icon — the 文A glyph */}
      <path d="M12.87 15.07l-2.54-2.51.03-.03A17.52 17.52 0 0 0 14.07 6H17V4h-7V2H8v2H1v2h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z" />
    </svg>
  );
}

PdfTranslateButton.displayName = 'PdfTranslateButton';
