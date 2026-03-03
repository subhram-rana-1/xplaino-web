import React, { useState, useEffect, useRef, useCallback } from 'react';
import styles from './PdfSelectionTrigger.module.css';
import type { HighlightColour } from '@/shared/services/pdfHighlightService';

interface SelectionState {
  text: string;
  x: number;
  y: number;
}

interface PdfSelectionTriggerProps {
  /** Container ref of the PDF content area to listen for selection events */
  containerRef: React.RefObject<HTMLDivElement | null>;
  /** Hex color of the currently active highlight color */
  activeColour: string;
  /** All available highlight colours from the API */
  highlightColours: HighlightColour[];
  /** Currently selected colour id */
  selectedColourId: string | null;
  /** Called when user picks a different highlight colour */
  onColourChange: (id: string) => void;
  /** Called with startText and endText when user confirms highlight */
  onHighlight: (startText: string, endText: string) => Promise<void>;
  /** Called when the highlight API call fails */
  onError?: (message: string) => void;
  /** Whether the user is currently logged in */
  isLoggedIn?: boolean;
  /** Called when user tries to highlight without being logged in */
  onLoginRequired?: () => void;
  /** Called when user clicks "Write a note" on a text selection */
  onWriteNote?: (startText: string, endText: string, clientY: number) => void;
}

const ICON_URL = 'https://bmicorrect.com/extension/icons/extension-tooltip-v2.ico';
const MAX_ANCHOR_CHARS = 15;
const WIDTH_ANIMATION_DURATION = 400;

/**
 * Listens for text selections inside the PDF content area and shows the
 * extension-style teal dot icon. On hover the dot shrinks and a pill-shaped
 * button group expands with Highlight, Write a Note and Copy actions.
 */
export const PdfSelectionTrigger: React.FC<PdfSelectionTriggerProps> = ({
  containerRef,
  activeColour,
  highlightColours,
  selectedColourId,
  onColourChange,
  onHighlight,
  onError,
  isLoggedIn = true,
  onLoginRequired,
  onWriteNote,
}) => {
  const [selection, setSelection] = useState<SelectionState | null>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [showButtonGroup, setShowButtonGroup] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [animationComplete, setAnimationComplete] = useState(false);
  const [isHighlighting, setIsHighlighting] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [isColorPickerVisible, setIsColorPickerVisible] = useState(false);

  const containerElRef = useRef<HTMLDivElement>(null);
  const buttonGroupRef = useRef<HTMLDivElement>(null);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mouseupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const animationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastMeasuredWidthRef = useRef(0);

  const clearSelection = useCallback(() => {
    setSelection(null);
    setIsHovering(false);
    setShowButtonGroup(false);
  }, []);

  // ── Selection detection ────────────────────────────────────────────────
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleMouseUp = (e: MouseEvent) => {
      if (mouseupTimerRef.current) clearTimeout(mouseupTimerRef.current);

      mouseupTimerRef.current = setTimeout(() => {
        const sel = window.getSelection();
        if (!sel || sel.isCollapsed || !sel.toString().trim()) return;

        const selectedText = sel.toString().trim();

        const range = sel.getRangeAt(0);
        const ancestor = range.commonAncestorContainer;
        const el = ancestor instanceof Element ? ancestor : ancestor.parentElement;
        if (!el) return;

        const isInPdfTextLayer =
          el.closest('.react-pdf__Page__textContent') !== null ||
          el.closest('.react-pdf__Page') !== null;
        if (!isInPdfTextLayer) return;

        setSelection({
          text: selectedText,
          x: e.clientX + 24,
          y: e.clientY + 8,
        });
        setIsHovering(false);
        setShowButtonGroup(false);
      }, 10);
    };

    const handleSelectionChange = () => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed) {
        clearSelection();
      }
    };

    container.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('selectionchange', handleSelectionChange);

    return () => {
      container.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('selectionchange', handleSelectionChange);
      if (mouseupTimerRef.current) clearTimeout(mouseupTimerRef.current);
    };
  }, [containerRef, clearSelection]);

  // ── Button group width animation (mirrors extension logic) ─────────────
  useEffect(() => {
    const element = buttonGroupRef.current;
    if (!element) return;

    if (!showButtonGroup) {
      setAnimationComplete(false);

      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
        animationTimeoutRef.current = null;
      }

      const currentWidthValue = element.style.getPropertyValue('--button-group-width');
      const currentWidth = currentWidthValue ? parseFloat(currentWidthValue) : lastMeasuredWidthRef.current;

      if (currentWidth > 0) {
        setIsClosing(true);
        element.style.setProperty('--button-group-width', `${currentWidth}px`);
        void element.offsetWidth;

        requestAnimationFrame(() => {
          element.style.setProperty('--button-group-width', '0px');
        });

        closingTimeoutRef.current = setTimeout(() => {
          setIsClosing(false);
        }, WIDTH_ANIMATION_DURATION + 50);
      } else {
        element.style.setProperty('--button-group-width', '0px');
        setIsClosing(false);
      }
      return;
    }

    // Opening
    setAnimationComplete(false);
    setIsClosing(false);

    const rafId = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!element) return;

        const currentWidthValue = element.style.getPropertyValue('--button-group-width');
        const currentWidth = currentWidthValue ? parseFloat(currentWidthValue) : 0;

        const savedMaxWidth = element.style.maxWidth;
        element.style.maxWidth = 'none';
        element.style.width = 'auto';
        element.style.setProperty('--button-group-width', 'auto');
        void element.offsetWidth;

        const naturalWidth = element.scrollWidth;
        lastMeasuredWidthRef.current = naturalWidth;

        element.style.maxWidth = savedMaxWidth || '600px';
        element.style.width = '';

        if (currentWidth === 0) {
          element.style.setProperty('--button-group-width', '38px');
          void element.offsetWidth;
        }

        requestAnimationFrame(() => {
          if (!element) return;
          element.style.setProperty('--button-group-width', `${naturalWidth}px`);

          animationTimeoutRef.current = setTimeout(() => {
            setAnimationComplete(true);
          }, WIDTH_ANIMATION_DURATION + 100);
        });
      });
    });

    return () => {
      cancelAnimationFrame(rafId);
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
        animationTimeoutRef.current = null;
      }
    };
  }, [showButtonGroup]);

  // ── Hover handlers ─────────────────────────────────────────────────────
  const handleIconMouseEnter = useCallback(() => {
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    setIsHovering(true);
    setShowButtonGroup(true);
  }, []);

  const handleContainerMouseLeave = useCallback((e: React.MouseEvent) => {
    const relatedTarget = e.relatedTarget;
    const isStillInContainer =
      relatedTarget instanceof Node && containerElRef.current?.contains(relatedTarget);

    if (!isStillInContainer) {
      hideTimeoutRef.current = setTimeout(() => {
        setShowButtonGroup(false);
        setIsHovering(false);
      }, 200);
    }
  }, []);

  const handleContainerMouseEnter = useCallback(() => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    setIsHovering(true);
    setShowButtonGroup(true);
  }, []);

  // ── Colour picker handlers ─────────────────────────────────────────────
  const handleChevronClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setShowColorPicker((prev) => {
      const next = !prev;
      if (next) setIsColorPickerVisible(true);
      return next;
    });
  }, []);

  const handleColourSelect = useCallback((id: string) => {
    onColourChange(id);
    setShowColorPicker(false);
  }, [onColourChange]);

  // Keep colour picker mounted briefly for exit animation
  useEffect(() => {
    if (showColorPicker) {
      setIsColorPickerVisible(true);
    } else {
      const t = setTimeout(() => setIsColorPickerVisible(false), 200);
      return () => clearTimeout(t);
    }
  }, [showColorPicker]);

  // ── Action handlers ────────────────────────────────────────────────────
  const handleHighlightClick = useCallback(async () => {
    if (!selection || isHighlighting) return;

    if (!isLoggedIn) {
      onLoginRequired?.();
      return;
    }

    const { text } = selection;
    const startText = text.slice(0, MAX_ANCHOR_CHARS);
    const endText = text.length > MAX_ANCHOR_CHARS ? text.slice(-MAX_ANCHOR_CHARS) : '';

    setIsHighlighting(true);
    try {
      await onHighlight(startText, endText);
      window.getSelection()?.removeAllRanges();
      clearSelection();
    } catch (err) {
      onError?.(err instanceof Error ? err.message : 'Failed to save highlight');
    } finally {
      setIsHighlighting(false);
    }
  }, [selection, isHighlighting, isLoggedIn, onLoginRequired, onHighlight, clearSelection, onError]);

  const handleCopyClick = useCallback(() => {
    // Try to copy the live DOM selection directly — most reliable for
    // preserving whitespace/line breaks from the PDF text layer.
    const winSel = window.getSelection();
    let copied = false;
    if (winSel && !winSel.isCollapsed) {
      try {
        copied = document.execCommand('copy');
      } catch {
        // fall through to clipboard API
      }
    }

    if (!copied && selection) {
      navigator.clipboard.writeText(selection.text).catch(() => {
        const ta = document.createElement('textarea');
        ta.value = selection.text;
        ta.style.cssText = 'position:fixed;left:-9999px;top:-9999px;opacity:0;';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      });
    }

    window.getSelection()?.removeAllRanges();
    clearSelection();
  }, [selection, clearSelection]);

  const handleWriteNoteClick = useCallback(() => {
    if (!selection) return;
    const { text } = selection;
    const startText = text.slice(0, MAX_ANCHOR_CHARS);
    const endText = text.length > MAX_ANCHOR_CHARS ? text.slice(-MAX_ANCHOR_CHARS) : '';
    onWriteNote?.(startText, endText, selection.y);
    window.getSelection()?.removeAllRanges();
    clearSelection();
  }, [selection, onWriteNote, clearSelection]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
      if (mouseupTimerRef.current) clearTimeout(mouseupTimerRef.current);
      if (animationTimeoutRef.current) clearTimeout(animationTimeoutRef.current);
      if (closingTimeoutRef.current) clearTimeout(closingTimeoutRef.current);
    };
  }, []);

  if (!selection) return null;

  const iconButtonClass = [
    styles.xplainoIconButton,
    isHovering ? styles.xplainoIconButtonHidden : styles.xplainoIconButtonVisible,
  ].join(' ');

  const buttonGroupClass = [
    styles.buttonGroup,
    showButtonGroup ? styles.buttonGroupVisible : '',
    isClosing ? styles.buttonGroupClosing : '',
    animationComplete ? styles.buttonGroupAnimationComplete : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      ref={containerElRef}
      className={styles.container}
      style={{ left: selection.x, top: selection.y }}
      onMouseLeave={handleContainerMouseLeave}
      onMouseEnter={handleContainerMouseEnter}
    >
      {/* Teal dot icon */}
      <button
        className={iconButtonClass}
        onMouseEnter={handleIconMouseEnter}
        aria-label="Xplaino Actions"
        type="button"
      >
        <img src={ICON_URL} alt="Xplaino" className={styles.xplainoIcon} />
      </button>

      {/* Pill button group */}
      <div
        ref={buttonGroupRef}
        className={buttonGroupClass}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Highlight — coloured circle with chevron colour-picker trigger */}
        <div className={`${styles.actionButtonWrapper} ${styles.highlightWrapper}`}>
          <button
            type="button"
            className={`${styles.actionButton} ${styles.highlightActionButton}`}
            onClick={handleHighlightClick}
            disabled={isHighlighting}
            aria-label="Highlight selected text"
          >
            {isHighlighting ? (
              <span className={styles.spinner} aria-hidden="true" />
            ) : (
              <span
                className={styles.colorCircle}
                style={{ background: activeColour }}
              />
            )}
          </button>
          <button
            type="button"
            className={styles.chevronBtn}
            onClick={handleChevronClick}
            aria-label="Choose highlight colour"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <ChevronDownIcon />
          </button>
          {(showColorPicker || isColorPickerVisible) && (
            <div
              className={`${styles.colorPickerPopover} ${showColorPicker ? styles.colorPickerVisible : styles.colorPickerHidden}`}
              onMouseDown={(e) => e.stopPropagation()}
            >
              {highlightColours.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className={`${styles.colourDot} ${c.id === selectedColourId ? styles.colourDotSelected : ''}`}
                  style={{ background: c.hexcode }}
                  onClick={() => handleColourSelect(c.id)}
                  aria-label={`Select colour ${c.hexcode}`}
                >
                  {c.id === selectedColourId && (
                    <span className={styles.colourCheck} aria-hidden="true">✓</span>
                  )}
                </button>
              ))}
            </div>
          )}
          <span className={styles.tooltip}>Highlight</span>
        </div>

        {/* Write a note */}
        <div className={styles.actionButtonWrapper}>
          <button
            type="button"
            className={styles.actionButton}
            onClick={handleWriteNoteClick}
            aria-label="Write a note"
          >
            <NoteIcon />
          </button>
          <span className={styles.tooltip}>Write a note</span>
        </div>

        {/* Copy with formatting */}
        <div className={styles.actionButtonWrapper}>
          <button
            type="button"
            className={styles.actionButton}
            onClick={handleCopyClick}
            aria-label="Copy selection"
          >
            <CopyIcon />
          </button>
          <span className={styles.tooltip}>Copy selection</span>
        </div>
      </div>
    </div>
  );
};

// ── Icon components ──────────────────────────────────────────────────────────

function ChevronDownIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function NoteIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

PdfSelectionTrigger.displayName = 'PdfSelectionTrigger';
