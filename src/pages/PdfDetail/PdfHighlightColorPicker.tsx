import React, { useState, useRef, useEffect } from 'react';
import type { HighlightColour } from '@/shared/services/pdfHighlightService';
import styles from './PdfHighlightColorPicker.module.css';

interface PdfHighlightColorPickerProps {
  colours: HighlightColour[];
  selectedColourId: string | null;
  onColourChange: (id: string) => void;
}

export const PdfHighlightColorPicker: React.FC<PdfHighlightColorPickerProps> = ({
  colours,
  selectedColourId,
  onColourChange,
}) => {
  const [open, setOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const leaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectedColour = colours.find((c) => c.id === selectedColourId);

  // Keep dropdown mounted briefly after close for exit animation
  useEffect(() => {
    if (open) {
      setIsAnimating(true);
    } else {
      const t = setTimeout(() => setIsAnimating(false), 200);
      return () => clearTimeout(t);
    }
  }, [open]);

  const handleMouseEnter = () => {
    if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
    setOpen(true);
  };

  const handleMouseLeave = () => {
    leaveTimerRef.current = setTimeout(() => setOpen(false), 120);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
    };
  }, []);

  if (colours.length === 0) return null;

  return (
    <div
      className={styles.container}
      ref={containerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        type="button"
        className={`${styles.triggerBtn} ${open ? styles.triggerBtnActive : ''}`}
        title="Highlighter"
        aria-label="Choose highlight color"
        aria-expanded={open}
      >
        <span
          className={styles.colorDot}
          style={{ background: selectedColour?.hexcode ?? '#fbbf24' }}
        />
        <span>Highlighter</span>
      </button>

      {(open || isAnimating) && (
        <div
          className={`${styles.dropdown} ${open ? styles.dropdownVisible : styles.dropdownHidden}`}
          role="listbox"
          aria-label="Highlight colors"
        >
          {colours.map((colour) => (
            <button
              key={colour.id}
              type="button"
              role="option"
              aria-selected={colour.id === selectedColourId}
              className={`${styles.colourOption} ${colour.id === selectedColourId ? styles.colourOptionSelected : ''}`}
              onClick={() => {
                onColourChange(colour.id);
                setOpen(false);
              }}
              title={colour.hexcode}
            >
              <span
                className={styles.colourDotLarge}
                style={{ background: colour.hexcode }}
              />
              {colour.id === selectedColourId && (
                <span className={styles.checkmark} aria-hidden="true">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

function HighlightIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {/* marker body */}
      <path d="M9 3h6l3 7H6L9 3z" />
      {/* tip */}
      <path d="M12 10v7" />
      {/* flat base / underline stroke */}
      <path d="M8 21h8" />
      {/* chisel tip triangle */}
      <path d="M10 17l2 4 2-4" />
    </svg>
  );
}

PdfHighlightColorPicker.displayName = 'PdfHighlightColorPicker';
