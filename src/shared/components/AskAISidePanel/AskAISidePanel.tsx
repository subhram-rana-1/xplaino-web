import React, { useState, useCallback, useEffect } from 'react';
import { FiChevronRight, FiBookmark } from 'react-icons/fi';
import styles from './AskAISidePanel.module.css';
import { AskAISidePanelView } from './AskAISidePanelView';

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
}) => {
  const isInline = mode === 'inline';
  const [width, setWidth] = useState(getPersistedWidth);
  const [isSlidingOut, setIsSlidingOut] = useState(false);
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
          <FiChevronRight size={18} />
        </button>
        <h3 className={styles.headerTitle}>{headerTitle}</h3>
        <div className={styles.headerActions}>
          {onScrollToText && (
            <button
              type="button"
              className={styles.headerIconBtn}
              onClick={onScrollToText}
              aria-label="Scroll to text"
              title="Go to selected text"
            >
              <PointLeftIcon />
            </button>
          )}
          {(onSaveChat || onDeleteChat) && (
            <button
              type="button"
              className={`${styles.headerIconBtn} ${isChatSaved ? styles.bookmarkSaved : ''}`}
              onClick={isChatSaved ? onDeleteChat : onSaveChat}
              aria-label={isChatSaved ? 'Delete saved chat' : 'Save chat'}
              title={isChatSaved ? 'Delete saved chat' : 'Save chat'}
            >
              <FiBookmark size={16} />
            </button>
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
        />
      </div>
    </div>
  );
};

function PointLeftIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 15l-6-6-6 6" transform="rotate(-90 12 12)" />
      <line x1="6" y1="12" x2="18" y2="12" />
    </svg>
  );
}

AskAISidePanel.displayName = 'AskAISidePanel';

