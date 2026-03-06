import React, { useState, useEffect, useRef } from 'react';
import { Languages, ChevronDown } from 'lucide-react';
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
 * - Hovering does nothing.
 * - Chevron button click toggles the language selector panel.
 * - Clicking "Translate PDF" toggles the panel when no language is selected;
 *   fires onTranslate() when a language is already selected.
 */
export const PdfTranslateButton: React.FC<PdfTranslateButtonProps> = ({
  selectedLanguage,
  onLanguageChange,
  onTranslate,
  isTranslating,
  isTranslated,
}) => {
  const [languageOptions, setLanguageOptions] = useState<LanguageDropdownOption[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  // Drives CSS visibility class after mount for fade-in/out
  const [isPanelVisible, setIsPanelVisible] = useState(false);
  // Keeps the panel in the DOM during the fade-out animation
  const [isPanelMounted, setIsPanelMounted] = useState(false);

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

    if (isDropdownOpen) {
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
  }, [isDropdownOpen]);

  useEffect(() => {
    return () => {
      if (fadeOutTimerRef.current) clearTimeout(fadeOutTimerRef.current);
    };
  }, []);

  const handleButtonClick = () => {
    if (isTranslating) return;
    if (selectedLanguage) {
      setIsDropdownOpen(false);
      onTranslate();
    } else {
      // No language selected — toggle the dropdown
      setIsDropdownOpen((prev) => !prev);
    }
  };

  const handleChevronClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isTranslating) return;
    setIsDropdownOpen((prev) => !prev);
  };

  return (
    <div className={styles.container}>
      {/* ── Main button ── */}
      <div
        className={`${styles.translateBtn} ${isTranslating ? styles.translating : ''} ${isTranslated ? styles.translated : ''}`}
      >
        <button
          type="button"
          className={styles.translateBtnMain}
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
        {/* Divider + Chevron */}
        <span className={styles.btnDivider} aria-hidden="true" />
        <button
          type="button"
          className={styles.chevronBtn}
          onClick={handleChevronClick}
          disabled={isTranslating}
          aria-label="Select language"
          aria-expanded={isDropdownOpen}
        >
          <ChevronDown
            size={13}
            className={`${styles.chevronIcon} ${isDropdownOpen ? styles.chevronOpen : ''}`}
            aria-hidden="true"
          />
        </button>
      </div>

      {/* ── Language selector panel (click-driven) ── */}
      {isPanelMounted && (
        <div
          className={[
            styles.panel,
            isPanelVisible ? styles.panelVisible : styles.panelHidden,
          ].join(' ')}
        >
          <p className={styles.panelTitle}>Translate to</p>
          {!selectedLanguage && (
            <p className={styles.noLangHint}>Select your native language</p>
          )}
          <LanguageDropdown
            options={languageOptions}
            value={selectedLanguage}
            onChange={(val) => {
              onLanguageChange(val);
              if (val) setIsDropdownOpen(false);
            }}
            placeholder="Select language"
          />
        </div>
      )}
    </div>
  );
};

function TranslateIcon() {
  return <Languages size={16} aria-hidden="true" />;
}

PdfTranslateButton.displayName = 'PdfTranslateButton';
