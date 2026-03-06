import React, { useState, useCallback, useEffect, useRef } from 'react';
import { ChevronRight, Bookmark, MousePointerClick, StickyNote, Trash2 } from 'lucide-react';
import styles from './AskAISidePanel.module.css';
import { AskAISidePanelView } from './AskAISidePanelView';
import type { HighlightColour } from '@/shared/services/pdfHighlightService';
import type { CustomPromptResponse } from '@/shared/types/customPrompt.types';

export interface AskAISidePanelProps {
  /** Whether panel is open */
  isOpen: boolean;
  /** Close handler */
  onClose: () => void;
  /** The prompt option selected from dropdown */
  selectedPrompt?: string;
  /** Handler for input submission */
  onInputSubmit?: (text: string) => void;
  /** Handler for stop request */
  onStopRequest?: () => void;
  /** Handler for clearing chat history */
  onClearChat?: () => void;
  /** Whether a request is currently in progress */
  isRequesting?: boolean;
  /** Chat messages */
  chatMessages?: Array<{ role: 'user' | 'assistant'; content: string }>;
  /** Streaming text content */
  streamingText?: string;
  /** Panel header title (defaults to "Chat with paragraphs") */
  headerTitle?: string;
  /** Suggested follow-up questions from the API */
  possibleQuestions?: string[];
  /** Layout mode: 'fixed' overlays the page (default), 'inline' pushes content left as a flex sibling */
  mode?: 'fixed' | 'inline';
  /** Called when user clicks the scroll-to-text icon */
  onScrollToText?: () => void;
  /** Called when user clicks the bookmark icon to save the chat */
  onSaveChat?: () => void;
  /** Called when user clicks the filled bookmark icon to delete the saved chat */
  onDeleteChat?: () => void;
  /** Whether this chat has been saved to the backend */
  isChatSaved?: boolean;
  /** When true, auto-focus the chat textarea (used when opening via Ask AI / Custom prompt) */
  autoFocusInput?: boolean;
  /** Called after the textarea has been focused so the parent can reset the flag */
  onInputFocused?: () => void;
  /** Called when user clicks "Highlight text" in the panel header */
  onHighlightText?: () => void;
  /** Called when user clicks "Add a note" in the panel header */
  onAddNote?: () => void;
  /** Available highlight colours for the colour picker */
  highlightColours?: HighlightColour[];
  /** Currently selected colour id */
  selectedColourId?: string | null;
  /** Called when the user picks a different highlight colour */
  onHighlightColourChange?: (id: string) => void;
  /** Hex code of the active highlight colour */
  activeColour?: string;
  /** When true, the highlight button is disabled (text already highlighted) */
  isTextHighlighted?: boolean;
  /** Called when user clicks "Delete explanation" — clears the entire explanation entry */
  onDeleteExplanation?: () => void;
  /** Override the default builtin prompt buttons shown in the panel (e.g. ['Summarise']) */
  builtinPrompts?: string[];
  /** User's saved custom prompts to show in the 3-dot popover */
  customPrompts?: CustomPromptResponse[];
  /** Called when user clicks "Add custom prompt" in the 3-dot popover */
  onAddCustomPrompt?: () => void;
}

const MIN_WIDTH = 300;
const MAX_WIDTH = 800;
const DEFAULT_WIDTH = 560;
const STORAGE_KEY = 'askAiSidePanelWidth';

function getPersistedWidth(): number {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = Number(stored);
      if (!Number.isNaN(parsed) && parsed >= MIN_WIDTH && parsed <= MAX_WIDTH) return parsed;
    }
  } catch { /* localStorage unavailable */ }
  return DEFAULT_WIDTH;
}

/**
 * AskAISidePanel - Resizable right-side panel component
 * 
 * @returns JSX element
 */
export const AskAISidePanel: React.FC<AskAISidePanelProps> = ({
  isOpen,
  onClose,
  selectedPrompt,
  onInputSubmit,
  onStopRequest,
  onClearChat,
  isRequesting = false,
  chatMessages = [],
  streamingText = '',
  headerTitle = 'Chat with paragraphs',
  possibleQuestions = [],
  mode = 'fixed',
  onScrollToText,
  onSaveChat,
  onDeleteChat,
  isChatSaved = false,
  autoFocusInput = false,
  onInputFocused,
  onHighlightText,
  onAddNote,
  highlightColours = [],
  selectedColourId = null,
  onHighlightColourChange,
  activeColour = '#fbbf24',
  isTextHighlighted = false,
  onDeleteExplanation,
  builtinPrompts,
  customPrompts,
  onAddCustomPrompt,
}) => {
  const isInline = mode === 'inline';
  const [width, setWidth] = useState(getPersistedWidth);
  const [isSlidingOut, setIsSlidingOut] = useState(false);
  const [isColourPanelOpen, setIsColourPanelOpen] = useState(false);
  const colourPanelLeaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [bottomPosition, setBottomPosition] = useState(0);
  const [topPosition, setTopPosition] = useState(80);

  // Calculate top/bottom positions — only needed for fixed mode
  useEffect(() => {
    if (isInline || !isOpen) return;

    const calculateTopPosition = () => {
      const navbar = document.querySelector('nav') || document.querySelector('[role="navigation"]');
      const navbarBottom = navbar ? navbar.getBoundingClientRect().bottom : 0;
      setTopPosition(Math.max(0, navbarBottom));
    };

    calculateTopPosition();
    window.addEventListener('resize', calculateTopPosition);
    window.addEventListener('scroll', calculateTopPosition, { passive: true });

    return () => {
      window.removeEventListener('resize', calculateTopPosition);
      window.removeEventListener('scroll', calculateTopPosition);
    };
  }, [isOpen, isInline]);

  useEffect(() => {
    if (isInline || !isOpen) return;

    const calculateBottomPosition = () => {
      const viewportHeight = window.innerHeight;
      const footer = document.querySelector('footer');
      if (!footer) { setBottomPosition(0); return; }
      const footerTop = footer.getBoundingClientRect().top;
      setBottomPosition(footerTop < viewportHeight ? Math.max(0, viewportHeight - footerTop) : 0);
    };

    calculateBottomPosition();
    window.addEventListener('resize', calculateBottomPosition);
    window.addEventListener('scroll', calculateBottomPosition, { passive: true });

    return () => {
      window.removeEventListener('resize', calculateBottomPosition);
      window.removeEventListener('scroll', calculateBottomPosition);
    };
  }, [isOpen, isInline]);

  // Handle slide out with animation
  const handleSlideOut = useCallback(() => {
    setIsSlidingOut(true);
    setTimeout(() => {
      onClose();
      setIsSlidingOut(false);
    }, 300);
  }, [onClose]);

  // Handle resize start
  const handleResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const startX = e.clientX;
      const startWidth = width;

      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'ew-resize';

      let latestWidth = startWidth;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const deltaX = startX - moveEvent.clientX;
        const newWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, startWidth + deltaX));
        latestWidth = newWidth;
        setWidth(newWidth);
      };

      const handleMouseUp = () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        document.body.style.userSelect = '';
        document.body.style.cursor = '';
        try { localStorage.setItem(STORAGE_KEY, String(latestWidth)); } catch { /* noop */ }
      };

      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    },
    [width],
  );

  // Colour picker hover handlers for the highlight button
  const handleHighlightBtnMouseEnter = useCallback(() => {
    if (colourPanelLeaveTimerRef.current) clearTimeout(colourPanelLeaveTimerRef.current);
    if (highlightColours.length > 0) setIsColourPanelOpen(true);
  }, [highlightColours.length]);

  const handleHighlightBtnMouseLeave = useCallback(() => {
    colourPanelLeaveTimerRef.current = setTimeout(() => setIsColourPanelOpen(false), 120);
  }, []);

  const handleColourPanelMouseEnter = useCallback(() => {
    if (colourPanelLeaveTimerRef.current) clearTimeout(colourPanelLeaveTimerRef.current);
  }, []);

  const handleColourPanelMouseLeave = useCallback(() => {
    colourPanelLeaveTimerRef.current = setTimeout(() => setIsColourPanelOpen(false), 120);
  }, []);

  // Fixed mode: don't render when closed
  if (!isInline && !isOpen) {
    return null;
  }

  const panelStyle: React.CSSProperties = isInline
    ? ({ '--panel-width': `${width}px` } as React.CSSProperties)
    : ({
        '--panel-width': `${width}px`,
        '--panel-top': `${topPosition}px`,
        '--panel-bottom': `${bottomPosition}px`,
      } as React.CSSProperties);

  const baseClass = isInline ? styles.sidePanelInline : styles.sidePanel;
  const panelClasses = [
    baseClass,
    isOpen ? styles.open : '',
    isSlidingOut ? styles.slidingOut : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={panelClasses} style={panelStyle}>
      {/* Resize Handle */}
      <div
        className={styles.resizeHandle}
        onMouseDown={handleResizeStart}
      />

      {/* Header */}
      <div className={styles.header}>
        <button
          type="button"
          className={styles.slideOutButton}
          onClick={handleSlideOut}
          aria-label="Minimize panel"
        >
          <ChevronRight size={18} />
        </button>
        <h3 className={styles.headerTitle}>{headerTitle}</h3>
        <div className={styles.headerActions}>
          {/* Highlight text button */}
          {onHighlightText && (
            <div
              className={styles.headerBtnWrapper}
              onMouseEnter={handleHighlightBtnMouseEnter}
              onMouseLeave={handleHighlightBtnMouseLeave}
            >
              <button
                type="button"
                className={`${styles.headerIconBtn} ${isTextHighlighted ? styles.headerIconBtnDisabled : ''}`}
                onClick={isTextHighlighted ? undefined : onHighlightText}
                disabled={isTextHighlighted}
                aria-label={isTextHighlighted ? 'Already highlighted' : 'Highlight text'}
              >
                <span
                  className={styles.colorCircle}
                  style={{ background: isTextHighlighted ? '#ccc' : activeColour }}
                />
              </button>
              {isColourPanelOpen && !isTextHighlighted && highlightColours.length > 0 && (
                <div
                  className={styles.colourPickerPopover}
                  onMouseEnter={handleColourPanelMouseEnter}
                  onMouseLeave={handleColourPanelMouseLeave}
                >
                  {highlightColours.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      className={`${styles.colourDot} ${c.id === selectedColourId ? styles.colourDotSelected : ''}`}
                      style={{ background: c.hexcode }}
                      onClick={() => { onHighlightColourChange?.(c.id); setIsColourPanelOpen(false); }}
                      aria-label={`Select colour ${c.hexcode}`}
                    >
                      {c.id === selectedColourId && (
                        <span className={styles.colourCheck} aria-hidden="true">✓</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
              {!isColourPanelOpen && (
                <span className={`${styles.headerTooltip} ${styles.headerTooltipAbove}`}>
                  {isTextHighlighted ? 'Already highlighted' : 'Highlight text'}
                </span>
              )}
            </div>
          )}

          {/* Add a note button */}
          {onAddNote && (
            <div className={styles.headerBtnWrapper}>
              <button
                type="button"
                className={styles.headerIconBtn}
                onClick={onAddNote}
                aria-label="Add a note"
              >
                <StickyNote size={16} />
              </button>
              <span className={styles.headerTooltip}>Add a note</span>
            </div>
          )}

          {/* Go to selected text */}
          {onScrollToText && (
            <div className={styles.headerBtnWrapper}>
              <button
                type="button"
                className={styles.headerIconBtn}
                onClick={onScrollToText}
                aria-label="Go to selected text"
              >
                <MousePointerClick size={16} />
              </button>
              <span className={styles.headerTooltip}>Go to selected text</span>
            </div>
          )}

          {/* Save / delete chat */}
          {(onSaveChat || onDeleteChat) && (
            <div className={styles.headerBtnWrapper}>
              <button
                type="button"
                className={`${styles.headerIconBtn} ${isChatSaved ? styles.bookmarkSaved : ''}`}
                onClick={isChatSaved ? onDeleteChat : onSaveChat}
                aria-label={isChatSaved ? 'Delete saved chat' : 'Save chat'}
              >
                <Bookmark size={16} />
              </button>
              <span className={styles.headerTooltip}>
                {isChatSaved ? 'Delete saved chat' : 'Save chat'}
              </span>
            </div>
          )}

          {/* Delete explanation */}
          {onDeleteExplanation && (
            <div className={styles.headerBtnWrapper}>
              <button
                type="button"
                className={styles.headerIconBtn}
                onClick={onDeleteExplanation}
                aria-label="Delete explanation"
              >
                <Trash2 size={16} />
              </button>
              <span className={styles.headerTooltip}>Delete explanation</span>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className={styles.content}>
        <AskAISidePanelView
          selectedPrompt={selectedPrompt}
          onInputSubmit={onInputSubmit}
          onStopRequest={onStopRequest}
          onClearChat={onClearChat}
          isRequesting={isRequesting}
          chatMessages={chatMessages}
          streamingText={streamingText}
          possibleQuestions={possibleQuestions}
          autoFocusInput={autoFocusInput}
          onInputFocused={onInputFocused}
          builtinPrompts={builtinPrompts}
          customPrompts={customPrompts}
          onAddCustomPrompt={onAddCustomPrompt}
        />
      </div>
    </div>
  );
};


AskAISidePanel.displayName = 'AskAISidePanel';

