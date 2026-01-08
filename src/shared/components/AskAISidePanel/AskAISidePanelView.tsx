import React, { useRef, useEffect, useState, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { FiArrowUp, FiTrash2, FiSquare } from 'react-icons/fi';
import styles from './AskAISidePanelView.module.css';

export interface AskAISidePanelViewProps {
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

const DEFAULT_PROMPTS = ['Short summary', 'Descriptive note'];

/**
 * AskAISidePanelView - Content view with chat interface and input bar
 * 
 * @returns JSX element
 */
export const AskAISidePanelView: React.FC<AskAISidePanelViewProps> = ({
  onInputSubmit,
  onStopRequest,
  onClearChat,
  isRequesting = false,
  chatMessages = [],
  streamingText = '',
}) => {
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [inputValue, setInputValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-scroll to bottom when new content arrives
  useEffect(() => {
    if (chatContainerRef.current && (streamingText || chatMessages.length > 0)) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [streamingText, chatMessages]);

  // Handle input submission
  const onInputSubmitRef = React.useRef(onInputSubmit);
  useEffect(() => {
    onInputSubmitRef.current = onInputSubmit;
  }, [onInputSubmit]);

  const handleSubmit = useCallback(() => {
    const trimmedValue = inputValue.trim();
    if (!trimmedValue || isSubmitting) return;
    
    setInputValue('');
    setIsSubmitting(true);
    
    // Call the callback using ref to avoid dependency
    onInputSubmitRef.current?.(trimmedValue);
    
    // Reset submitting state after a short delay
    setTimeout(() => {
      setIsSubmitting(false);
    }, 100);
  }, [inputValue, isSubmitting]);

  // Handle Enter key press
  const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

  // Handle default prompt click
  const handlePromptClick = useCallback((prompt: string) => {
    onInputSubmitRef.current?.(prompt);
  }, []);

  const hasChatHistory = chatMessages.length > 0;
  // Always show default prompts above input bar
  const showDefaultPrompts = true;

  // Memoize ReactMarkdown components
  const markdownComponents = React.useMemo(() => ({
    h1: ({ children }: any) => <h1 className={styles.markdownH1}>{children}</h1>,
    h2: ({ children }: any) => <h2 className={styles.markdownH2}>{children}</h2>,
    h3: ({ children }: any) => <h3 className={styles.markdownH3}>{children}</h3>,
    p: ({ children }: any) => <p className={styles.markdownP}>{children}</p>,
    ul: ({ children }: any) => <ul className={styles.markdownUl}>{children}</ul>,
    ol: ({ children }: any) => <ol className={styles.markdownOl}>{children}</ol>,
    li: ({ children }: any) => <li className={styles.markdownLi}>{children}</li>,
    strong: ({ children }: any) => <strong className={styles.markdownStrong}>{children}</strong>,
    em: ({ children }: any) => <em className={styles.markdownEm}>{children}</em>,
    code: ({ children }: any) => <code className={styles.markdownCode}>{children}</code>,
  }), []);

  return (
    <div className={styles.view}>
      {/* Scrollable Content Area */}
      <div ref={chatContainerRef} className={styles.chatContainer}>
        {/* Show chat messages when available */}
        {hasChatHistory && (
          <div className={styles.messages}>
            {chatMessages.map((message, index) => (
              <div
                key={index}
                className={`${styles.message} ${message.role === 'user' ? styles.userMessage : styles.assistantMessage}`}
              >
                {message.role === 'assistant' ? (
                  <ReactMarkdown components={markdownComponents}>
                    {message.content}
                  </ReactMarkdown>
                ) : (
                  message.content
                )}
              </div>
            ))}
            {/* Show streaming assistant response */}
            {streamingText && streamingText.trim().length > 0 && (
              <div className={`${styles.message} ${styles.assistantMessage}`}>
                <ReactMarkdown components={markdownComponents}>
                  {streamingText}
                </ReactMarkdown>
                <span className={styles.cursor}>|</span>
              </div>
            )}
          </div>
        )}

        {/* Show initial streaming response when no chat history */}
        {!hasChatHistory && streamingText && streamingText.trim().length > 0 && (
          <div className={styles.explanationContent}>
            <ReactMarkdown components={markdownComponents}>
              {streamingText}
            </ReactMarkdown>
          </div>
        )}
      </div>

      {/* Default Prompts - positioned above input bar */}
      {showDefaultPrompts && (
        <div className={styles.defaultPrompts}>
          <span className={styles.promptsContainer}>
            {DEFAULT_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                className={styles.promptButton}
                onClick={() => handlePromptClick(prompt)}
              >
                {prompt}
              </button>
            ))}
          </span>
        </div>
      )}

      {/* User Input Bar */}
      <div className={styles.inputBar}>
        <div className={styles.inputWrapper}>
          <input
            type="text"
            className={styles.input}
            placeholder="Ask about the explanation"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
          />
        </div>
        
        {/* Stop Button - Show when request is in progress */}
        {isRequesting ? (
          <button
            type="button"
            className={styles.stopButton}
            onClick={onStopRequest}
            aria-label="Stop request"
          >
            <FiSquare size={18} />
          </button>
        ) : (
          /* Send Button - Disabled when input is empty */
          <button
            type="button"
            className={styles.sendButton}
            onClick={handleSubmit}
            disabled={!inputValue.trim() || isSubmitting}
            aria-label="Ask question"
          >
            <FiArrowUp size={18} />
          </button>
        )}

        {/* Delete/Clear Button - Show when there is chat history */}
        {hasChatHistory && onClearChat && (
          <button
            type="button"
            className={styles.deleteButton}
            onClick={onClearChat}
            aria-label="Clear chat history"
          >
            <FiTrash2 size={18} />
          </button>
        )}
      </div>
    </div>
  );
};

AskAISidePanelView.displayName = 'AskAISidePanelView';

