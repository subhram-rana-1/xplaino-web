import React, { useState, useCallback } from 'react';
import { FiX } from 'react-icons/fi';
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
  } as React.CSSProperties;

  return (
    <div className={styles.sidePanel} style={panelStyle}>
      {/* Resize Handle */}
      <div
        className={styles.resizeHandle}
        onMouseDown={handleResizeStart}
      />

      {/* Header */}
      <div className={styles.header}>
        <h3 className={styles.headerTitle}>Ask AI</h3>
        <button
          type="button"
          className={styles.closeButton}
          onClick={onClose}
          aria-label="Close panel"
        >
          <FiX size={20} />
        </button>
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

