import React, { useState, useCallback, useEffect } from 'react';
import { FiChevronRight } from 'react-icons/fi';
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
}

const MIN_WIDTH = 300;
const MAX_WIDTH = 800;
const DEFAULT_WIDTH = 560;

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
}) => {
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [isSlidingOut, setIsSlidingOut] = useState(false);
  const [bottomPosition, setBottomPosition] = useState(0);
  const [topPosition, setTopPosition] = useState(80);

  // Calculate top position based on navbar
  useEffect(() => {
    const calculateTopPosition = () => {
      // Get navbar element
      const navbar = document.querySelector('nav') || document.querySelector('[role="navigation"]');
      const navbarBottom = navbar ? navbar.getBoundingClientRect().bottom : 0;
      
      // Top should be minimum of (viewport top = 0, navbar bottom)
      const top = Math.max(0, navbarBottom);
      setTopPosition(top);
    };

    if (isOpen) {
      calculateTopPosition();
      window.addEventListener('resize', calculateTopPosition);
      window.addEventListener('scroll', calculateTopPosition, { passive: true });

      return () => {
        window.removeEventListener('resize', calculateTopPosition);
        window.removeEventListener('scroll', calculateTopPosition);
      };
    }
  }, [isOpen]);

  // Calculate bottom position to respect viewport and footer
  useEffect(() => {
    const calculateBottomPosition = () => {
      const viewportHeight = window.innerHeight;
      const footer = document.querySelector('footer');
      
      if (!footer) {
        // No footer, touch viewport bottom
        setBottomPosition(0);
        return;
      }
      
      const footerTop = footer.getBoundingClientRect().top;
      
      // If footer is visible in viewport, set bottom to avoid it
      if (footerTop < viewportHeight) {
        const bottom = Math.max(0, viewportHeight - footerTop);
        setBottomPosition(bottom);
      } else {
        // Footer not visible, touch viewport bottom
        setBottomPosition(0);
      }
    };

    if (isOpen) {
      calculateBottomPosition();
      window.addEventListener('resize', calculateBottomPosition);
      window.addEventListener('scroll', calculateBottomPosition, { passive: true });

      return () => {
        window.removeEventListener('resize', calculateBottomPosition);
        window.removeEventListener('scroll', calculateBottomPosition);
      };
    }
  }, [isOpen]);

  // Handle slide out with animation
  const handleSlideOut = useCallback(() => {
    setIsSlidingOut(true);
    setTimeout(() => {
      onClose();
      setIsSlidingOut(false);
    }, 300); // Match animation duration
  }, [onClose]);

  // Handle resize start
  const handleResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      
      const startX = e.clientX;
      const startWidth = width;
      
      // Prevent text selection during resize
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'ew-resize';
      
      const handleMouseMove = (moveEvent: MouseEvent) => {
        // Since panel is on the right, dragging left increases width
        const deltaX = startX - moveEvent.clientX;
        const newWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, startWidth + deltaX));
        setWidth(newWidth);
      };
      
      const handleMouseUp = () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        document.body.style.userSelect = '';
        document.body.style.cursor = '';
      };
      
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    },
    [width]
  );

  // Don't render if not open
  if (!isOpen) {
    return null;
  }

  const panelStyle: React.CSSProperties = {
    '--panel-width': `${width}px`,
    '--panel-top': `${topPosition}px`,
    '--panel-bottom': `${bottomPosition}px`,
  } as React.CSSProperties;

  const panelClasses = `${styles.sidePanel} ${isOpen ? styles.open : ''} ${isSlidingOut ? styles.slidingOut : ''}`;

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
        <h3 className={styles.headerTitle}>Chat with paragraphs</h3>
        <div className={styles.headerSpacer}></div>
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
        />
      </div>
    </div>
  );
};

AskAISidePanel.displayName = 'AskAISidePanel';

