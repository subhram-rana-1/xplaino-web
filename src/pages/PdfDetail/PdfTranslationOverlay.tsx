import React from 'react';
import type { TranslatedParagraph } from '@/shared/services/pdfTranslationService';
import styles from './PdfTranslationOverlay.module.css';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PdfTranslationOverlayProps {
  /** Translated paragraphs with normalized bboxes (values 0–1 fraction of page). */
  paragraphs: TranslatedParagraph[];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * PdfTranslationOverlay
 *
 * Renders translated text blocks absolutely positioned over the PDF page canvas.
 * Bboxes are already normalized to 0–1 fractions of page dimensions, so they
 * map directly to percentage-based CSS positions on an overlay that matches the
 * rendered page size.
 *
 * Should be rendered as a sibling of the react-pdf <Page> element, inside a
 * container with `position: relative` that has the same dimensions as the page.
 */
export const PdfTranslationOverlay: React.FC<PdfTranslationOverlayProps> = ({ paragraphs }) => {
  if (paragraphs.length === 0) return null;

  return (
    <div className={styles.overlay} aria-hidden="true">
      {paragraphs.map((para, index) => {
        const { left, top, width, fontSize } = para.bbox;

        // Convert normalized font size (fraction of page height) to a percentage
        // of the overlay height, then clamp to a readable range.
        const fontSizePercent = Math.max(0.8, Math.min(fontSize * 100, 3));

        return (
          <div
            key={index}
            className={styles.paragraph}
            style={{
              left: `${left * 100}%`,
              top: `${top * 100}%`,
              width: `${Math.max(width * 100, 5)}%`,
              fontSize: `${fontSizePercent}cqh`,
            }}
          >
            {para.translatedText}
          </div>
        );
      })}
    </div>
  );
};

PdfTranslationOverlay.displayName = 'PdfTranslationOverlay';
