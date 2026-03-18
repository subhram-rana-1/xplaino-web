import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Trash2, X } from 'lucide-react';
import type { PdfHighlight, HighlightColour } from '@/shared/services/pdfHighlightService';
import type { PdfNote } from '@/shared/services/pdfNoteService';
import { normalisePdfText, buildNormalisedWithIndexMap } from './pdfTextNormalise';
import styles from './PdfHighlightLayer.module.css';

/** Convert a hex color to an opaque pastel by alpha-blending over white.
 *  e.g. hexToPastel('#fbbf24', 0.33) → 'rgb(253,235,191)' — a light amber. */
function hexToPastel(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const blend = (c: number) => Math.round(c * alpha + 255 * (1 - alpha));
  return `rgb(${blend(r)},${blend(g)},${blend(b)})`;
}

const NOTE_EDITOR_SIZE_KEY = 'xplaino-note-editor-size';

function getSavedNoteEditorSize(): { width: number; height: number } | null {
  try {
    const raw = localStorage.getItem(NOTE_EDITOR_SIZE_KEY);
    if (!raw) return null;
    const { width, height } = JSON.parse(raw);
    if (typeof width === 'number' && typeof height === 'number') return { width, height };
  } catch { /* ignore */ }
  return null;
}

interface HighlightRect {
  highlightId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  hexcode: string;
}

interface NoteIconPosition {
  noteId: string;
  y: number;
}

interface NoteEditorState {
  /** 'create' = new note for a highlight; 'edit' = editing an existing note */
  mode: 'create' | 'edit';
  /** highlightId used in 'create' mode to look up startText/endText; empty when created from selection */
  highlightId: string;
  /** noteId used in 'edit' mode */
  noteId: string | null;
  y: number;
  /** Set when opening from a raw text selection (no existing highlight) */
  startText?: string;
  endText?: string;
}

interface ExplanationItem {
  id: string;
  startText: string;
  endText: string;
}

interface PdfHighlightLayerProps {
  highlights: PdfHighlight[];
  colours: HighlightColour[];
  pageContainerEl: HTMLDivElement | null;
  renderVersion: number;
  onDelete: (id: string) => Promise<void>;
  notes: PdfNote[];
  onCreateNote: (startText: string, endText: string, content: string) => Promise<PdfNote>;
  onUpdateNote: (noteId: string, content: string) => Promise<PdfNote>;
  onDeleteNote: (noteId: string) => Promise<void>;
  userFirstName?: string;
  /** Set by parent when user clicks "Write a note" from the text selection trigger */
  pendingNoteForSelection?: { startText: string; endText: string; clientY: number } | null;
  /** When true, disables all write actions (delete highlight, create/edit/delete notes). Read-only display only. */
  readOnly?: boolean;
  /** Whether the current user is logged in. Used to allow unauthenticated users to open the note editor (auth is checked lazily at save time). */
  isLoggedIn?: boolean;
  /** Explained text items to show book icons for */
  explanations?: ExplanationItem[];
  /** Currently active explanation id (open in panel) */
  activeExplanationId?: string | null;
  /** Called when user clicks a book icon */
  onExplanationIconClick?: (id: string) => void;
  /** When set, the matching explanation text range pulses 3x with teal background */
  pulsingExplanationId?: string | null;
  /** Called after the pulse animation finishes so the parent can clear the state */
  onPulseComplete?: () => void;
  /** When set, opens the note editor anchored to this explanation's computed y position */
  pendingNoteForExplanationId?: string | null;
  /** When true, hides the explanation book icons (e.g. for citation highlights that reuse the explanations slot) */
  hideExplanationIcons?: boolean;
}

function computeHighlightRects(
  textContainer: Element,
  pageContainerRect: DOMRect,
  highlight: { startText: string; endText?: string },
  hexcode: string,
  highlightId: string,
): HighlightRect[] {
  const spans = Array.from(
    textContainer.querySelectorAll('span[role="presentation"], span'),
  ).filter((s) => s.textContent && s.textContent.trim().length > 0) as HTMLElement[];

  if (spans.length === 0) return [];

  // Build full concatenated text and per-span character offsets (in original text).
  // PDF.js puts each line in its own span with no trailing/leading space.
  // Insert a synthetic space between adjacent spans so that line-boundary
  // text like "high."|"These" becomes "high. These" — matching the backend's
  // properly-spaced citation content.  Skip the space when the previous span
  // ends with a hyphen (line-continuation, e.g. "low-"|"income" → "low-income").
  const spanOffsets: { start: number; end: number; el: HTMLElement }[] = [];
  let fullText = '';
  for (const span of spans) {
    const t = span.textContent ?? '';
    const lastChar = fullText.length > 0 ? fullText[fullText.length - 1] : '';
    const needsSpace =
      fullText.length > 0 &&
      lastChar !== ' ' && lastChar !== '\t' &&
      lastChar !== '-' &&
      t.length > 0 &&
      t[0] !== ' ' && t[0] !== '\t';
    if (needsSpace) fullText += ' ';
    spanOffsets.push({ start: fullText.length, end: fullText.length + t.length, el: span });
    fullText += t;
  }

  // Build normalised text and an index map: normToOrig[i] = position in fullText.
  // This replaces the previous linear-ratio approximation which caused whole-paragraph
  // highlights when whitespace was unevenly distributed.
  const { normText: normFull, normToOrig } = buildNormalisedWithIndexMap(fullText);
  const normStart = normalisePdfText(highlight.startText);

  if (!normStart) return [];

  // Exact match only — no fallback. If the normalised citation text is not
  // found verbatim in the page's normalised text, return nothing rather than
  // risk highlighting the wrong location via a partial substring match.
  const startIdx = normFull.indexOf(normStart);
  if (startIdx === -1) return [];

  let endIdxEnd = startIdx + normStart.length;

  // If endText is provided, search for it starting from the beginning of the
  // startText match (not from after it).  This handles the common case where
  // endText is a trailing portion of startText itself (e.g. startText =
  // "Endotracheal intubation and airway management", endText = "airway
  // management").  Starting the search from after startText would skip that
  // in-range occurrence and land on a later duplicate, producing a massive
  // over-highlight.
  const normEnd = highlight.endText ? normalisePdfText(highlight.endText) : '';
  if (normEnd) {
    const searchFrom = startIdx;
    const endMatchIdx = normFull.indexOf(normEnd, searchFrom);
    if (endMatchIdx !== -1) {
      endIdxEnd = endMatchIdx + normEnd.length;
    }
  }

  if (endIdxEnd <= startIdx) return [];

  // Map normalised indices back to original text positions exactly.
  const origStart = normToOrig[startIdx] ?? 0;
  const origEnd = endIdxEnd < normToOrig.length
    ? normToOrig[endIdxEnd]
    : fullText.length;

  const overlappingSpans = spanOffsets.filter(
    (s) => s.end > origStart && s.start < origEnd,
  );

  if (overlappingSpans.length === 0) return [];

  // For each overlapping span, compute a tight DOMRect using the Range API so
  // that only the highlighted portion of the first and last partial spans is
  // measured, not their full extent.
  const tightRects: DOMRect[] = overlappingSpans.map((spanMeta) => {
    const inSpanStart = Math.max(0, origStart - spanMeta.start);
    const inSpanEnd = Math.min(spanMeta.end - spanMeta.start, origEnd - spanMeta.start);

    // Only apply Range API when the span is partially covered; fall back to
    // getBoundingClientRect for fully-covered spans or when the Range fails.
    const isPartial = inSpanStart > 0 || inSpanEnd < spanMeta.end - spanMeta.start;
    if (isPartial) {
      const textNode = spanMeta.el.firstChild;
      if (textNode && textNode.nodeType === Node.TEXT_NODE) {
        try {
          const range = document.createRange();
          const maxLen = textNode.textContent?.length ?? 0;
          range.setStart(textNode, Math.min(inSpanStart, maxLen));
          range.setEnd(textNode, Math.min(inSpanEnd, maxLen));
          const r = range.getBoundingClientRect();
          if (r.width > 0 || r.height > 0) return r;
        } catch {
          // fall through to getBoundingClientRect
        }
      }
    }
    return spanMeta.el.getBoundingClientRect();
  });

  // Group tight rects by line (spans whose tops are within LINE_TOLERANCE px)
  // and merge each group into a single highlight band.
  const LINE_TOLERANCE = 4;
  const rects: HighlightRect[] = [];
  let lineRects: DOMRect[] = [];

  const flush = () => {
    if (lineRects.length === 0) return;
    const top = Math.min(...lineRects.map((r) => r.top));
    const bottom = Math.max(...lineRects.map((r) => r.bottom));
    const left = Math.min(...lineRects.map((r) => r.left));
    const right = Math.max(...lineRects.map((r) => r.right));
    rects.push({
      highlightId,
      x: left - pageContainerRect.left,
      y: top - pageContainerRect.top,
      width: right - left,
      height: bottom - top,
      hexcode,
    });
    lineRects = [];
  };

  for (const tightRect of tightRects) {
    if (lineRects.length === 0) {
      lineRects.push(tightRect);
    } else {
      const prev = lineRects[lineRects.length - 1];
      if (Math.abs(tightRect.top - prev.top) <= LINE_TOLERANCE) {
        lineRects.push(tightRect);
      } else {
        flush();
        lineRects.push(tightRect);
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
  notes,
  onCreateNote,
  onUpdateNote,
  onDeleteNote,
  userFirstName,
  pendingNoteForSelection,
  readOnly = false,
  isLoggedIn,
  explanations = [],
  activeExplanationId,
  onExplanationIconClick,
  pulsingExplanationId,
  onPulseComplete,
  pendingNoteForExplanationId,
  hideExplanationIcons = false,
}) => {
  const [rects, setRects] = useState<HighlightRect[]>([]);
  const [activeNoteRects, setActiveNoteRects] = useState<HighlightRect[]>([]);
  const [explainIconPositions, setExplainIconPositions] = useState<{ id: string; y: number }[]>([]);
  const [explainHighlightRects, setExplainHighlightRects] = useState<{ id: string; rects: HighlightRect[] }[]>([]);
  const [noteHighlightRects, setNoteHighlightRects] = useState<{ noteId: string; rects: HighlightRect[] }[]>([]);
  const [hoveredNoteId, setHoveredNoteId] = useState<string | null>(null);
  const [hoveredHighlightId, setHoveredHighlightId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [menuHighlightId, setMenuHighlightId] = useState<string | null>(null);
  const [noteEditorState, setNoteEditorState] = useState<NoteEditorState | null>(null);
  const [noteEditorVisible, setNoteEditorVisible] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [noteEditorSaved, setNoteEditorSaved] = useState(false);
  const [isDeletingNote, setIsDeletingNote] = useState(false);
  const [pageWidth, setPageWidth] = useState(0);
  const [noteIconPositions, setNoteIconPositions] = useState<NoteIconPosition[]>([]);
  const [scrollVersion, setScrollVersion] = useState(0);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const noteEditorRef = useRef<HTMLDivElement>(null);

  // Move cursor to end of text when note editor opens or switches note
  useEffect(() => {
    const el = textareaRef.current;
    if (!el || !noteEditorState) return;
    const len = el.value.length;
    el.setSelectionRange(len, len);
  }, [noteEditorState]);

  // Trigger open transition on next frame whenever a (new) note editor mounts
  const noteEditorKey = noteEditorState
    ? `${noteEditorState.highlightId}-${noteEditorState.mode}-${noteEditorState.noteId}`
    : null;
  useEffect(() => {
    if (!noteEditorKey) {
      setNoteEditorVisible(false);
      return;
    }
    setNoteEditorVisible(false);
    const raf = requestAnimationFrame(() => setNoteEditorVisible(true));
    return () => cancelAnimationFrame(raf);
  }, [noteEditorKey]);

  // Persist note editor size when the user resizes it
  useEffect(() => {
    if (!noteEditorKey) return;
    // Wait a frame so the portal ref is attached
    const raf = requestAnimationFrame(() => {
      const el = noteEditorRef.current;
      if (!el) return;
      const saved = getSavedNoteEditorSize();
      if (saved) {
        el.style.width = `${saved.width}px`;
        el.style.height = `${saved.height}px`;
      }
    });
    return () => cancelAnimationFrame(raf);
  }, [noteEditorKey]);

  useEffect(() => {
    if (!noteEditorKey) return;
    const el = noteEditorRef.current;
    if (!el) return;
    let skipFirst = true;
    const observer = new ResizeObserver((entries) => {
      if (skipFirst) { skipFirst = false; return; }
      const entry = entries[0];
      if (!entry) return;
      const w = Math.round(entry.borderBoxSize?.[0]?.inlineSize ?? el.offsetWidth);
      const h = Math.round(entry.borderBoxSize?.[0]?.blockSize ?? el.offsetHeight);
      try { localStorage.setItem(NOTE_EDITOR_SIZE_KEY, JSON.stringify({ width: w, height: h })); } catch { /* ignore */ }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [noteEditorKey]);

  // Re-render when scroll container moves so the fixed-position note editor portal stays aligned
  useEffect(() => {
    if (!noteEditorState || !pageContainerEl) return;
    const scrollEl = (pageContainerEl.closest('[class*="mainArea"]') as HTMLElement | null)
      ?? (pageContainerEl.parentElement as HTMLElement | null);
    if (!scrollEl) return;
    const onScroll = () => setScrollVersion((v) => v + 1);
    scrollEl.addEventListener('scroll', onScroll, { passive: true });
    return () => scrollEl.removeEventListener('scroll', onScroll);
  }, [noteEditorState, pageContainerEl]);

  // Open note editor when parent signals a "Write a note" from text selection
  useEffect(() => {
    if ((readOnly && isLoggedIn !== false) || !pendingNoteForSelection || !pageContainerEl) return;
    const pageRect = pageContainerEl.getBoundingClientRect();
    if (
      pendingNoteForSelection.clientY < pageRect.top - 40 ||
      pendingNoteForSelection.clientY > pageRect.bottom + 40
    ) return;
    const y = Math.max(0, pendingNoteForSelection.clientY - pageRect.top);
    setNoteEditorState({
      mode: 'create',
      highlightId: '',
      noteId: null,
      y,
      startText: pendingNoteForSelection.startText,
      endText: pendingNoteForSelection.endText,
    });
    setNoteContent('');
    setNoteEditorSaved(false);
  }, [pendingNoteForSelection, pageContainerEl]);

  // Open note editor when parent requests it for a specific explanation (from the panel header)
  useEffect(() => {
    if (!pendingNoteForExplanationId || readOnly) return;
    const pos = explainIconPositions.find((p) => p.id === pendingNoteForExplanationId);
    const explanation = explanations.find((e) => e.id === pendingNoteForExplanationId);
    if (!pos || !explanation) return;
    setNoteEditorState({
      mode: 'create',
      highlightId: '',
      noteId: null,
      y: pos.y,
      startText: explanation.startText,
      endText: explanation.endText,
    });
    setNoteContent('');
    setNoteEditorSaved(false);
  }, [pendingNoteForExplanationId, explainIconPositions, explanations, readOnly]);

  // Compute temporary teal rects for selection-based notes (no existing highlight)
  useEffect(() => {
    if (!noteEditorState?.startText || !pageContainerEl) {
      setActiveNoteRects([]);
      return;
    }
    const textContainer = pageContainerEl.querySelector('.react-pdf__Page__textContent');
    if (!textContainer) { setActiveNoteRects([]); return; }
    const pageRect = pageContainerEl.getBoundingClientRect();
    const computed = computeHighlightRects(
      textContainer,
      pageRect,
      { startText: noteEditorState.startText, endText: noteEditorState.endText },
      '#0d8070',
      '__note_active__',
    );
    setActiveNoteRects(computed);
  }, [noteEditorState, pageContainerEl, renderVersion]);

  // Recompute rects and note icon positions when page renders or data changes
  useEffect(() => {
    const container = pageContainerEl;
    if (!container) return;

    const timer = setTimeout(() => {
      const textContainer = container.querySelector('.react-pdf__Page__textContent');
      if (!textContainer) return;

      const pageRect = container.getBoundingClientRect();
      const colourMap = new Map(colours.map((c) => [c.id, c.hexcode]));

      const allRects: HighlightRect[] = [];
      for (const hl of highlights) {
        const hexcode = colourMap.get(hl.highlightColourId) ?? '#fbbf24';
        const computed = computeHighlightRects(textContainer, pageRect, hl, hexcode, hl.id);
        allRects.push(...computed);
      }
      setRects(allRects);
      setPageWidth(container.offsetWidth);

      const iconPositions: NoteIconPosition[] = [];
      const noteHlRects: { noteId: string; rects: HighlightRect[] }[] = [];
      for (const note of notes) {
        const computed = computeHighlightRects(
          textContainer,
          pageRect,
          { startText: note.startText, endText: note.endText },
          '#0d8070',
          note.id,
        );
        if (computed.length > 0) {
          iconPositions.push({ noteId: note.id, y: computed[0].y });
          noteHlRects.push({ noteId: note.id, rects: computed });
        }
      }
      setNoteIconPositions(iconPositions);
      setNoteHighlightRects(noteHlRects);

      // Compute explanation icon positions and highlight rects
      const explainIcons: { id: string; y: number }[] = [];
      const explainHlRects: { id: string; rects: HighlightRect[] }[] = [];
      for (const explanation of explanations) {
        const computed = computeHighlightRects(
          textContainer,
          pageRect,
          { startText: explanation.startText, endText: explanation.endText },
          '#0d8070',
          explanation.id,
        );
        if (computed.length > 0) {
          explainIcons.push({ id: explanation.id, y: computed[0].y });
          explainHlRects.push({ id: explanation.id, rects: computed });
        }
      }
      setExplainIconPositions(explainIcons);
      setExplainHighlightRects(explainHlRects);
    }, 80);

    return () => clearTimeout(timer);
  }, [highlights, colours, notes, explanations, pageContainerEl, renderVersion]);

  // Inject space text-nodes between adjacent PDF.js text spans so that the
  // browser's built-in Ctrl+F can search across line boundaries (e.g. the
  // word "Understands" ends one span and "basic" starts the next — without a
  // space in the DOM, Ctrl+F sees "Understandsbasic" and can't find
  // "Understands basic"). The injected spacer spans are zero-size, invisible,
  // and filtered out by computeHighlightRects (whose filter requires
  // textContent.trim().length > 0, and a single space trims to "").
  useEffect(() => {
    const container = pageContainerEl;
    if (!container) return;
    const textLayer = container.querySelector('.react-pdf__Page__textContent');
    if (!textLayer) return;

    // Remove any spacers we injected on a previous render to avoid accumulation.
    textLayer.querySelectorAll('[data-pdf-space]').forEach((el) => el.remove());

    const spans = Array.from(
      textLayer.querySelectorAll('span[role="presentation"], span'),
    ).filter((s) => (s as HTMLElement).textContent?.trim()) as HTMLElement[];

    for (let i = 0; i < spans.length - 1; i++) {
      const cur = spans[i];
      const next = spans[i + 1];
      const curText = cur.textContent ?? '';
      const nextText = next.textContent ?? '';
      const needsSpace =
        curText.length > 0 &&
        !curText.endsWith(' ') &&
        curText[curText.length - 1] !== '-' &&
        nextText.length > 0 &&
        !nextText.startsWith(' ');
      if (needsSpace) {
        const spacer = document.createElement('span');
        spacer.setAttribute('data-pdf-space', '1');
        spacer.setAttribute('aria-hidden', 'true');
        spacer.style.cssText =
          'position:absolute;overflow:hidden;width:0;height:0;pointer-events:none;user-select:text;';
        spacer.textContent = ' ';
        cur.after(spacer);
      }
    }
  }, [pageContainerEl, renderVersion]);

  // Coordinate-based hover detection
  useEffect(() => {
    if (!pageContainerEl) return;

    const onMove = (e: MouseEvent) => {
      const containerRect = pageContainerEl.getBoundingClientRect();
      const x = e.clientX - containerRect.left;
      const y = e.clientY - containerRect.top;

      // First pass: strict bounds — mouse is directly over a highlight rect.
      // This always wins to avoid a preceding highlight's buffer zone stealing
      // hover from a later highlight the mouse is actually on.
      let hit = rects.find(
        (r) => x >= r.x && x <= r.x + r.width && y >= r.y && y <= r.y + r.height,
      );

      // Second pass: if no strict match, extend the last rect of each highlight
      // upward and rightward to bridge the gap to the menu button (top:-14px, right:-14px).
      if (!hit) {
        const lastIdx = new Map<string, number>();
        rects.forEach((r, i) => lastIdx.set(r.highlightId, i));
        const MENU_BUFFER = 16;
        hit = rects.find((r, i) => {
          if (lastIdx.get(r.highlightId) !== i) return false;
          return x >= r.x && x <= r.x + r.width + MENU_BUFFER && y >= r.y - MENU_BUFFER && y <= r.y + r.height;
        });
      }

      setHoveredHighlightId(hit?.highlightId ?? null);
    };
    const onLeave = () => setHoveredHighlightId(null);

    pageContainerEl.addEventListener('mousemove', onMove);
    pageContainerEl.addEventListener('mouseleave', onLeave);
    return () => {
      pageContainerEl.removeEventListener('mousemove', onMove);
      pageContainerEl.removeEventListener('mouseleave', onLeave);
    };
  }, [pageContainerEl, rects]);

  // Close menu when clicking outside
  useEffect(() => {
    if (!menuHighlightId) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuHighlightId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuHighlightId]);

  const handleDelete = useCallback(
    async (id: string) => {
      if (deletingId) return;
      setMenuHighlightId(null);
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

  const handleMenuBtnClick = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setMenuHighlightId((prev) => (prev === id ? null : id));
  }, []);

  const handleOpenNewNoteEditor = useCallback(
    (highlightId: string) => {
      setMenuHighlightId(null);
      const filtered = rects.filter((r) => r.highlightId === highlightId);
      const lastRect = filtered[filtered.length - 1];
      if (!lastRect) return;
      setNoteEditorState({ mode: 'create', highlightId, noteId: null, y: lastRect.y });
      setNoteContent('');
      setNoteEditorSaved(false);
    },
    [rects],
  );

  const handleOpenEditNoteEditor = useCallback(
    (noteId: string, y: number) => {
      const note = notes.find((n) => n.id === noteId);
      if (!note) return;
      // Find the highlight that matches this note's anchors to get its id
      const matchedHighlight = highlights.find(
        (h) => h.startText === note.startText && h.endText === note.endText,
      );
      setNoteEditorState({
        mode: 'edit',
        highlightId: matchedHighlight?.id ?? '',
        noteId,
        y,
        startText: note.startText,
        endText: note.endText,
      });
      setNoteContent(note.content);
      setNoteEditorSaved(false);
    },
    [notes, highlights],
  );

  const closeNoteEditorWithAnimation = useCallback(() => {
    setNoteEditorVisible(false);
    setTimeout(() => {
      setNoteEditorState(null);
      setNoteContent('');
      setNoteEditorSaved(false);
    }, 250);
  }, []);

  const handleCancelNote = useCallback(() => {
    closeNoteEditorWithAnimation();
  }, [closeNoteEditorWithAnimation]);

  const handleSaveNote = useCallback(async () => {
    if (!noteEditorState || isSavingNote) return;

    setIsSavingNote(true);
    try {
      if (noteEditorState.mode === 'create') {
        let startText: string;
        let endText: string;
        if (noteEditorState.startText !== undefined) {
          startText = noteEditorState.startText;
          endText = noteEditorState.endText ?? '';
        } else {
          const highlight = highlights.find((h) => h.id === noteEditorState.highlightId);
          if (!highlight) return;
          startText = highlight.startText;
          endText = highlight.endText ?? '';
        }
        await onCreateNote(startText, endText, noteContent.trim());
      } else {
        if (!noteEditorState.noteId) return;
        await onUpdateNote(noteEditorState.noteId, noteContent.trim());
      }
      setNoteEditorSaved(true);
      closeNoteEditorWithAnimation();
    } catch {
      closeNoteEditorWithAnimation();
    } finally {
      setIsSavingNote(false);
    }
  }, [noteEditorState, isSavingNote, highlights, noteContent, onCreateNote, onUpdateNote, closeNoteEditorWithAnimation]);

  const handleDeleteNote = useCallback(async () => {
    if (!noteEditorState?.noteId || isDeletingNote) return;
    setIsDeletingNote(true);
    try {
      await onDeleteNote(noteEditorState.noteId);
      closeNoteEditorWithAnimation();
    } catch {
      // silently degrade
    } finally {
      setIsDeletingNote(false);
    }
  }, [noteEditorState, isDeletingNote, onDeleteNote, closeNoteEditorWithAnimation]);

  if (rects.length === 0 && noteIconPositions.length === 0 && !noteEditorState && explainIconPositions.length === 0) return null;

  // Capture live scroll-adjusted rect for the note editor portal.
  // scrollVersion is incremented by the scroll listener above so this value
  // is re-evaluated on every scroll event, keeping the fixed-position popup aligned.
  // DOMRect getters (top, right, etc.) live on the prototype so we extract them explicitly.
  const noteEditorPageRect = (() => {
    if (!noteEditorState || !pageContainerEl) return null;
    void scrollVersion;
    const r = pageContainerEl.getBoundingClientRect();
    return { top: r.top, right: r.right, bottom: r.bottom, left: r.left };
  })();

  const lastRectIndexByHighlight = new Map<string, number>();
  rects.forEach((rect, i) => lastRectIndexByHighlight.set(rect.highlightId, i));

  // Highlight whose note editor is currently open — used to draw dashed underline
  let activeNoteHighlightId: string | null = null;
  if (noteEditorState) {
    if (noteEditorState.mode === 'create' && noteEditorState.highlightId) {
      activeNoteHighlightId = noteEditorState.highlightId;
    } else if (noteEditorState.mode === 'edit' && noteEditorState.noteId) {
      const note = notes.find((n) => n.id === noteEditorState.noteId);
      if (note) {
        const hl = highlights.find(
          (h) => h.startText === note.startText && h.endText === note.endText,
        );
        activeNoteHighlightId = hl?.id ?? null;
      }
    }
  }

  return (
    <>
      {/* Highlight color bands — z-index: 1 so they sit behind the text layer */}
      <div className={styles.layer} aria-hidden="true">
        {rects.map((rect, i) => {
          const isNoteActive = activeNoteHighlightId === rect.highlightId;
          return (
            <div
              key={`${rect.highlightId}-${i}`}
              className={styles.highlightRectWrapper}
              style={{ left: rect.x, top: rect.y, width: rect.width, height: rect.height }}
            >
              <div
                className={styles.highlightRect}
                style={{ background: isNoteActive ? hexToPastel('#0d8070', 0.22) : hexToPastel(rect.hexcode, 0.33) }}
              />
            </div>
          );
        })}

        {activeNoteRects.map((rect, i) => (
          <div
            key={`__note_active__-${i}`}
            className={styles.highlightRectWrapper}
            style={{ left: rect.x, top: rect.y, width: rect.width, height: rect.height }}
          >
            <div
              className={styles.highlightRect}
              style={{ background: hexToPastel('#0d8070', 0.22) }}
            />
          </div>
        ))}

        {hoveredNoteId &&
          noteHighlightRects
            .filter(({ noteId }) => noteId === hoveredNoteId)
            .flatMap(({ noteId, rects: nRects }) =>
              nRects.map((rect, i) => (
                <div
                  key={`note-hover-hl-${noteId}-${i}`}
                  className={styles.highlightRectWrapper}
                  style={{ left: rect.x, top: rect.y, width: rect.width, height: rect.height }}
                >
                  <div
                    className={styles.highlightRect}
                    style={{ background: hexToPastel('#0d8070', 0.33) }}
                  />
                </div>
              ))
            )}

        {explainHighlightRects
          .filter(({ id }) => id === activeExplanationId)
          .flatMap(({ id, rects: exRects }) =>
            exRects.map((rect, i) => (
              <div
                key={`explain-hl-${id}-${i}`}
                className={styles.highlightRectWrapper}
                style={{ left: rect.x, top: rect.y, width: rect.width, height: rect.height }}
              >
                <div
                  className={styles.highlightRect}
                  style={{ background: hexToPastel('#0d8070', 0.22) }}
                />
              </div>
            ))
          )}

        {pulsingExplanationId &&
          explainHighlightRects
            .filter(({ id }) => id === pulsingExplanationId)
            .flatMap(({ id, rects: exRects }) =>
              exRects.map((rect, i) => (
                <div
                  key={`pulse-${id}-${i}`}
                  className={styles.pulseHighlight}
                  style={{ left: rect.x, top: rect.y, width: rect.width, height: rect.height }}
                  onAnimationEnd={i === 0 ? onPulseComplete : undefined}
                />
              ))
            )}
      </div>

      {/* Interactive elements — z-index: 3 so they sit above the text layer */}
      <div className={styles.interactiveLayer} aria-hidden="true">
        {rects.map((rect, i) => {
          const isHovered = hoveredHighlightId === rect.highlightId;
          const isDeleting = deletingId === rect.highlightId;
          const isLastRectForHighlight = lastRectIndexByHighlight.get(rect.highlightId) === i;
          const isMenuOpen = menuHighlightId === rect.highlightId;

          if (!isLastRectForHighlight || readOnly) return null;

          const highlight = highlights.find((h) => h.id === rect.highlightId);
          const highlightHasNote = highlight
            ? notes.some(
                (n) => n.startText === highlight.startText && n.endText === highlight.endText,
              )
            : false;

          return (
            <div
              key={`menu-${rect.highlightId}-${i}`}
              className={styles.highlightRectWrapper}
              style={{ left: rect.x, top: rect.y, width: rect.width, height: rect.height }}
            >
              <div ref={isMenuOpen ? menuRef : undefined} className={styles.menuContainer}>
                <button
                  type="button"
                  className={`${styles.menuBtn} ${isHovered || isMenuOpen ? styles.menuBtnVisible : ''}`}
                  onClick={(e) => handleMenuBtnClick(e, rect.highlightId)}
                  disabled={isDeleting}
                  aria-label="Highlight actions"
                >
                  {isDeleting ? (
                    <span className={styles.deletingSpinner} aria-hidden="true" />
                  ) : (
                    <span className={styles.menuBtnDot} aria-hidden="true" />
                  )}
                </button>

                {isMenuOpen && (
                  <div className={styles.dropdownMenu}>
                    {!highlightHasNote && (
                      <button
                        type="button"
                        className={styles.dropdownItem}
                        onClick={() => handleOpenNewNoteEditor(rect.highlightId)}
                      >
                        <NoteIconOutline />
                        <span>Add a note</span>
                      </button>
                    )}
                    <button
                      type="button"
                      className={`${styles.dropdownItem} ${styles.dropdownItemDanger}`}
                      onClick={() => handleDelete(rect.highlightId)}
                    >
                      <Trash2 size={13} />
                        <span>Clear highlight</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {noteIconPositions.map((pos) => (
          <div
            key={pos.noteId}
            className={styles.marginIconWrapper}
            style={{ left: pageWidth - 40, top: pos.y }}
          >
            <button
              type="button"
              className={`${styles.noteIcon} ${readOnly ? styles.noteIconReadOnly : ''}`}
              aria-label={readOnly ? 'View note' : 'Edit note'}
              onMouseEnter={() => setHoveredNoteId(pos.noteId)}
              onMouseLeave={() => setHoveredNoteId(null)}
              onClick={() => { if (!readOnly) handleOpenEditNoteEditor(pos.noteId, pos.y); }}
            >
              <NoteIcon />
            </button>
            <span className={styles.marginTooltip}>{readOnly ? 'View note' : 'Edit note'}</span>
          </div>
        ))}

        {!hideExplanationIcons && explainIconPositions.map((pos) => {
          const isActive = pos.id === activeExplanationId;
          const explanation = explanations.find((e) => e.id === pos.id);
          const isLoading = !!(explanation && (explanation as any).isRequesting && !(explanation as any).firstChunkReceived);
          const isSaved = !!(explanation as any)?.textChatId;
          const tooltipLabel = isLoading ? 'Generating explanation…' : 'View explanation';
          return (
            <div
              key={pos.id}
              className={styles.marginIconWrapper}
              style={{ left: -40, top: pos.y }}
            >
              <button
                type="button"
                className={`${styles.explainIcon} ${isActive && !isLoading ? styles.explainIconActive : ''} ${isLoading ? styles.explainIconLoading : ''}`}
                aria-label={tooltipLabel}
                disabled={isLoading}
                onClick={isLoading ? undefined : () => onExplanationIconClick?.(pos.id)}
              >
                {isLoading ? <SpinnerIcon /> : isSaved ? <FilledBookIcon /> : <BookIcon />}
              </button>
              <span className={styles.marginTooltip}>{tooltipLabel}</span>
            </div>
          );
        })}
      </div>

      {/* Note editor (create or edit) — rendered in a portal so it escapes overflow clipping */}
      {noteEditorState && pageWidth > 0 && pageContainerEl && noteEditorPageRect && createPortal(
        <div
          ref={noteEditorRef}
          className={`${styles.noteEditor} ${noteEditorState.mode === 'create' ? styles.noteEditorCreate : styles.noteEditorEdit} ${noteEditorVisible ? styles.noteEditorVisible : ''}`}
          style={(() => {
            const MARGIN = 8;
            const editorH = noteEditorRef.current?.offsetHeight ?? 220;
            const editorW = noteEditorRef.current?.offsetWidth ?? 220;
            const rawTop = noteEditorPageRect.top + noteEditorState.y;
            const clampedTop = Math.min(
              Math.max(MARGIN, rawTop),
              window.innerHeight - editorH - MARGIN,
            );
            // right = distance from viewport right edge; clamp so editor stays on screen
            const rawRight = Math.max(MARGIN, window.innerWidth - (noteEditorPageRect.left + pageWidth + 300));
            const clampedRight = Math.min(rawRight, window.innerWidth - editorW - MARGIN);
            return { right: clampedRight, top: clampedTop };
          })()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className={styles.noteEditorHeader}>
            <button
              type="button"
              className={styles.noteEditorMinimise}
              onClick={handleCancelNote}
              disabled={isSavingNote || noteEditorSaved || isDeletingNote}
              aria-label="Close note editor"
            >
              <X size={15} />
            </button>
            <span>
              {noteEditorState.mode === 'edit'
                ? (userFirstName ?? 'Note')
                : 'Add a note'}
            </span>
          </div>
          <textarea
            ref={textareaRef}
            className={styles.noteEditorTextarea}
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            placeholder="Write your note here…"
            rows={4}
            autoFocus
            disabled={isSavingNote || noteEditorSaved || isDeletingNote}
          />
          <div className={styles.noteEditorActions}>
            {noteEditorState.mode === 'edit' && (
              <button
                type="button"
                className={styles.noteEditorDeleteNote}
                onClick={handleDeleteNote}
                disabled={isSavingNote || noteEditorSaved || isDeletingNote}
                aria-label="Delete note"
              >
                {isDeletingNote ? (
                  <span className={styles.savingSpinner} aria-hidden="true" />
                ) : (
                  <Trash2 size={15} />
                )}
              </button>
            )}
            <button
              type="button"
              className={styles.noteEditorSave}
              onClick={handleSaveNote}
              disabled={isSavingNote || noteEditorSaved || isDeletingNote || !noteContent.trim()}
            >
              {isSavingNote ? (
                <span className={styles.savingSpinner} aria-hidden="true" />
              ) : noteEditorState.mode === 'edit' ? (
                'Update'
              ) : (
                'Save'
              )}
            </button>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
};

// ── Icon components ──────────────────────────────────────────────────────────

function NoteIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      width="18"
      height="18"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="8" y1="13" x2="16" y2="13" />
      <line x1="8" y1="17" x2="13" y2="17" />
    </svg>
  );
}

function NoteIconOutline() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      width="13"
      height="13"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function BookIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      width="16"
      height="16"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function FilledBookIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      width="16"
      height="16"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      width="16"
      height="16"
      className={styles.spinnerIcon}
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray="40 20"
      />
    </svg>
  );
}

PdfHighlightLayer.displayName = 'PdfHighlightLayer';
