import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FiTrash2 } from 'react-icons/fi';
import type { PdfHighlight, HighlightColour } from '@/shared/services/pdfHighlightService';
import styles from './PdfHighlightLayer.module.css';

interface HighlightRect {
  highlightId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  hexcode: string;
}

interface PdfHighlightLayerProps {
  /** All highlights for this specific page */
  highlights: PdfHighlight[];
  /** Available colour definitions */
  colours: HighlightColour[];
  /** The .pageWrapper container DOM element */
  pageContainerEl: HTMLDivElement | null;
  /** Signal prop: increment to re-compute rects after page render */
  renderVersion: number;
  /** Delete a highlight by id */
  onDelete: (id: string) => Promise<void>;
}

/**
 * Computes which character-index ranges in the full page text correspond to
 * startText / endText anchors, then maps back to span rects.
 */
function computeHighlightRects(
  textContainer: Element,
  pageContainerRect: DOMRect,
  highlight: PdfHighlight,
  hexcode: string,
): HighlightRect[] {
  // Collect all leaf text spans with non-empty textContent
  const spans = Array.from(
    textContainer.querySelectorAll('span[role="presentation"], span'),
  ).filter((s) => s.textContent && s.textContent.trim().length > 0) as HTMLElement[];

  if (spans.length === 0) return [];

  // Build full page text and span offset map
  const spanOffsets: { start: number; end: number; el: HTMLElement }[] = [];
  let fullText = '';
  for (const span of spans) {
    const t = span.textContent ?? '';
    spanOffsets.push({ start: fullText.length, end: fullText.length + t.length, el: span });
    fullText += t;
  }

  // Normalize whitespace for matching
  const normalise = (s: string) => s.replace(/\s+/g, ' ').trim();
  const normFull = normalise(fullText);
  const normStart = normalise(highlight.startText);
  const normEnd = normalise(highlight.endText || highlight.startText);

  if (!normStart) return [];

  const startIdx = normFull.indexOf(normStart);
  if (startIdx === -1) return [];

  // Find where endText ends — search from startIdx + normStart.length - normEnd.length
  const endSearchStart = startIdx + normStart.length - normEnd.length;
  const endIdx =
    normFull.indexOf(normEnd, Math.max(startIdx, endSearchStart)) + normEnd.length;

  if (endIdx <= startIdx) return [];

  // Map back to original fullText indices (normalisation ratio may differ slightly)
  // Use simple heuristic: proportional mapping via ratio
  const ratio = fullText.length / normFull.length;
  const origStart = Math.floor(startIdx * ratio);
  const origEnd = Math.min(Math.ceil(endIdx * ratio), fullText.length);

  // Find which spans overlap [origStart, origEnd)
  const overlappingSpans = spanOffsets.filter(
    (s) => s.end > origStart && s.start < origEnd,
  );

  if (overlappingSpans.length === 0) return [];

  // Group consecutive spans into line-level rects (merge spans on same line)
  const LINE_TOLERANCE = 4; // px
  const rects: HighlightRect[] = [];
  let lineSpans: typeof overlappingSpans = [];

  const flush = () => {
    if (lineSpans.length === 0) return;
    const clientRects = lineSpans.map((s) => s.el.getBoundingClientRect());
    const top = Math.min(...clientRects.map((r) => r.top));
    const bottom = Math.max(...clientRects.map((r) => r.bottom));
    const left = Math.min(...clientRects.map((r) => r.left));
    const right = Math.max(...clientRects.map((r) => r.right));

    rects.push({
      highlightId: highlight.id,
      x: left - pageContainerRect.left,
      y: top - pageContainerRect.top,
      width: right - left,
      height: bottom - top,
      hexcode,
    });
    lineSpans = [];
  };

  for (const spanMeta of overlappingSpans) {
    const rect = spanMeta.el.getBoundingClientRect();
    if (lineSpans.length === 0) {
      lineSpans.push(spanMeta);
    } else {
      const prevRect = lineSpans[lineSpans.length - 1].el.getBoundingClientRect();
      if (Math.abs(rect.top - prevRect.top) <= LINE_TOLERANCE) {
        lineSpans.push(spanMeta);
      } else {
        flush();
        lineSpans.push(spanMeta);
      }
    }
  }
  flush();

  return rects;
}

export const PdfHighlightLayer: React.FC<PdfHighlightLayerProps> = ({
  highlights,
  colours,
  pageContainerEl,
  renderVersion,
  onDelete,
}) => {
  const [rects, setRects] = useState<HighlightRect[]>([]);
  const [hoveredHighlightId, setHoveredHighlightId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Recompute rects when page renders or highlights change
  useEffect(() => {
    const container = pageContainerEl;
    if (!container) return;

    // Small delay to ensure the text layer is fully painted
    const timer = setTimeout(() => {
      const textContainer = container.querySelector('.react-pdf__Page__textContent');
      if (!textContainer) return;

      const pageRect = container.getBoundingClientRect();
      const colourMap = new Map(colours.map((c) => [c.id, c.hexcode]));

      const allRects: HighlightRect[] = [];
      for (const hl of highlights) {
        const hexcode = colourMap.get(hl.highlightColourId) ?? '#fbbf24';
        const computed = computeHighlightRects(textContainer, pageRect, hl, hexcode);
        allRects.push(...computed);
      }
      setRects(allRects);
    }, 80);

    return () => clearTimeout(timer);
  }, [highlights, colours, pageContainerEl, renderVersion]);

  const handleDelete = useCallback(
    async (id: string) => {
      if (deletingId) return;
      setDeletingId(id);
      try {
        await onDelete(id);
        setRects((prev) => prev.filter((r) => r.highlightId !== id));
        setHoveredHighlightId(null);
      } catch {
        // parent handles error display
      } finally {
        setDeletingId(null);
      }
    },
    [deletingId, onDelete],
  );

  if (rects.length === 0) return null;

  // Find the index of the last rect for each highlightId so we only render
  // one delete button per highlight (on its last / bottom-most line rect).
  const lastRectIndexByHighlight = new Map<string, number>();
  rects.forEach((rect, i) => lastRectIndexByHighlight.set(rect.highlightId, i));

  return (
    <div className={styles.layer} aria-hidden="true">
      {rects.map((rect, i) => {
        const isHovered = hoveredHighlightId === rect.highlightId;
        const isDeleting = deletingId === rect.highlightId;
        const isLastRectForHighlight = lastRectIndexByHighlight.get(rect.highlightId) === i;

        return (
          <div
            key={`${rect.highlightId}-${i}`}
            className={styles.highlightRectWrapper}
            style={{
              left: rect.x,
              top: rect.y,
              width: rect.width,
              height: rect.height,
            }}
            onMouseEnter={() => {
              if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
              setHoveredHighlightId(rect.highlightId);
            }}
            onMouseLeave={() => {
              hoverTimerRef.current = setTimeout(() => {
                setHoveredHighlightId(null);
              }, 200);
            }}
          >
            {/* The highlight color band */}
            <div
              className={styles.highlightRect}
              style={{ background: `${rect.hexcode}55` }}
            />

            {/* One delete button per highlight — only on the last rect */}
            {isLastRectForHighlight && (
              <button
                type="button"
                className={`${styles.deleteBtn} ${isHovered ? styles.deleteBtnVisible : ''}`}
                onClick={() => handleDelete(rect.highlightId)}
                disabled={isDeleting}
                aria-label="Delete highlight"
                onMouseEnter={() => {
                  if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
                  setHoveredHighlightId(rect.highlightId);
                }}
                onMouseLeave={() => {
                  hoverTimerRef.current = setTimeout(() => {
                    setHoveredHighlightId(null);
                  }, 200);
                }}
              >
                {isDeleting ? (
                  <span className={styles.deletingSpinner} aria-hidden="true" />
                ) : (
                  <FiTrash2 size={11} />
                )}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
};

PdfHighlightLayer.displayName = 'PdfHighlightLayer';
