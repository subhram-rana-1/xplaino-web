import React, { useState, useEffect, useRef, useCallback } from 'react';
import styles from './PdfSelectionTrigger.module.css';

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
  /** Called with startText and endText when user confirms highlight */
  onHighlight: (startText: string, endText: string) => Promise<void>;
  /** Called when the highlight API call fails */
  onError?: (message: string) => void;
  /** Whether the user is currently logged in */
  isLoggedIn?: boolean;
  /** Called when user tries to highlight without being logged in */
  onLoginRequired?: () => void;
}

const MAX_ANCHOR_CHARS = 15;

/**
 * Listens for text selections inside the PDF content area and shows a floating
 * colored circle icon. On hover the icon expands to a Highlight action button.
 */
export const PdfSelectionTrigger: React.FC<PdfSelectionTriggerProps> = ({
  containerRef,
  activeColour,
  onHighlight,
  onError,
  isLoggedIn = true,
  onLoginRequired,
}) => {
  const [selection, setSelection] = useState<SelectionState | null>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [isHighlighting, setIsHighlighting] = useState(false);
  const hoverLeaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mouseupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearSelection = useCallback(() => {
    setSelection(null);
    setIsHovering(false);
  }, []);

  // Listen on mouseup to detect drag selections inside PDF text layer
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleMouseUp = (e: MouseEvent) => {
      if (mouseupTimerRef.current) clearTimeout(mouseupTimerRef.current);

      mouseupTimerRef.current = setTimeout(() => {
        const sel = window.getSelection();
        if (!sel || sel.isCollapsed || !sel.toString().trim()) {
          return;
        }

        const selectedText = sel.toString().trim();

        // Ensure the selection is inside the PDF text layer
        const range = sel.getRangeAt(0);
        const ancestor = range.commonAncestorContainer;
        const el = ancestor instanceof Element ? ancestor : ancestor.parentElement;
        if (!el) return;

        const isInPdfTextLayer =
          el.closest('.react-pdf__Page__textContent') !== null ||
          el.closest('.react-pdf__Page') !== null;
        if (!isInPdfTextLayer) return;

        // Position icon at the mouse release point
        setSelection({
          text: selectedText,
          x: e.clientX + 24,
          y: e.clientY + 8,
        });
        setIsHovering(false);
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

  const handleIconMouseEnter = () => {
    if (hoverLeaveTimerRef.current) clearTimeout(hoverLeaveTimerRef.current);
    setIsHovering(true);
  };

  const handleIconMouseLeave = () => {
    hoverLeaveTimerRef.current = setTimeout(() => {
      setIsHovering(false);
    }, 120);
  };

  const handleGroupMouseEnter = () => {
    if (hoverLeaveTimerRef.current) clearTimeout(hoverLeaveTimerRef.current);
    setIsHovering(true);
  };

  const handleGroupMouseLeave = () => {
    hoverLeaveTimerRef.current = setTimeout(() => {
      setIsHovering(false);
    }, 120);
  };

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
  }, [selection, isHighlighting, isLoggedIn, onLoginRequired, onHighlight, clearSelection]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (hoverLeaveTimerRef.current) clearTimeout(hoverLeaveTimerRef.current);
      if (mouseupTimerRef.current) clearTimeout(mouseupTimerRef.current);
    };
  }, []);

  if (!selection) return null;

  return (
    <div
      className={styles.root}
      style={{ left: selection.x, top: selection.y }}
    >
      {/* Colored circle icon — hidden when hovering (replaced by button group) */}
      <div
        className={`${styles.iconCircle} ${isHovering ? styles.iconCircleHidden : ''}`}
        style={{ background: activeColour }}
        onMouseEnter={handleIconMouseEnter}
        onMouseLeave={handleIconMouseLeave}
        aria-hidden={isHovering}
      >
        <PenIcon />
      </div>

      {/* Action pill — slides in on hover */}
      <div
        className={`${styles.actionPill} ${isHovering ? styles.actionPillVisible : ''}`}
        onMouseEnter={handleGroupMouseEnter}
        onMouseLeave={handleGroupMouseLeave}
      >
        <button
          type="button"
          className={styles.highlightBtn}
          onClick={handleHighlightClick}
          disabled={isHighlighting}
          aria-label="Highlight selected text"
        >
          {isHighlighting ? (
            <span className={styles.spinner} aria-hidden="true" />
          ) : (
            <MarkerIcon color={activeColour} />
          )}
          <span>Highlight</span>
        </button>
      </div>
    </div>
  );
};

function PenIcon() {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#fff"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
    </svg>
  );
}

function MarkerIcon({ color }: { color: string }) {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  );
}

PdfSelectionTrigger.displayName = 'PdfSelectionTrigger';
