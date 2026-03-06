import React, { useRef, useEffect, useState, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { ArrowUp, Trash2, Square, Plus, MoreVertical, BookMarked, ExternalLink } from 'lucide-react';
import { LoadingDots } from '@/shared/components/LoadingDots';
import type { CustomPromptResponse } from '@/shared/types/customPrompt.types';
import styles from './AskAISidePanelView.module.css';

function stripHtml(html: string): string {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
}

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
  /** Suggested follow-up questions from the API. When non-empty, shown instead of default prompts. */
  possibleQuestions?: string[];
  /** When true, auto-focus the chat textarea */
  autoFocusInput?: boolean;
  /** Called after the textarea has been focused */
  onInputFocused?: () => void;
  /** Override the default builtin prompt buttons (default: ['Short summary', 'Descriptive note']) */
  builtinPrompts?: string[];
  /** User's saved custom prompts to show in the 3-dot popover */
  customPrompts?: CustomPromptResponse[];
  /** Called when user clicks "Add custom prompt" in the 3-dot popover */
  onAddCustomPrompt?: () => void;
}

const DEFAULT_PROMPTS = ['Short summary', 'Descriptive note'];

const PROMPT_TEXT_MAP: Record<string, string> = {
  'Short summary': 'Generate a short summary about the selected paragraphs',
  'Descriptive note': 'Generate a descriptive note on the selected paragraphs',
};

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
  possibleQuestions = [],
  autoFocusInput = false,
  onInputFocused,
  builtinPrompts,
  customPrompts,
  onAddCustomPrompt,
}) => {
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [inputValue, setInputValue] = useState('');
  const [showPanelPopover, setShowPanelPopover] = useState(false);
  const panelPopoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

  // Scroll detection logic
  const SCROLL_THRESHOLD = 5; // pixels from bottom to consider "at bottom"
  
  const checkIfAtBottom = useCallback((element: HTMLDivElement): boolean => {
    const { scrollTop, scrollHeight, clientHeight } = element;
    return scrollTop >= scrollHeight - clientHeight - SCROLL_THRESHOLD;
  }, []);

  // Handle scroll events to detect user scrolling
  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (checkIfAtBottom(container)) {
        // User scrolled to bottom - re-enable auto-scroll
        setShouldAutoScroll(true);
      } else {
        // User scrolled up - disable auto-scroll
        setShouldAutoScroll(false);
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [checkIfAtBottom]);

  // Auto-scroll to bottom when new content arrives (only if shouldAutoScroll is true)
  useEffect(() => {
    if (chatContainerRef.current && shouldAutoScroll && (streamingText || chatMessages.length > 0)) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [streamingText, chatMessages, shouldAutoScroll]);

  // Auto-focus input when requested (e.g. opened via "Ask AI" button)
  useEffect(() => {
    if (autoFocusInput && inputRef.current) {
      inputRef.current.focus();
      onInputFocused?.();
    }
  }, [autoFocusInput, onInputFocused]);

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
    const questionText = PROMPT_TEXT_MAP[prompt] || prompt;
    onInputSubmitRef.current?.(questionText);
  }, []);

  const hasChatHistory = chatMessages.length > 0;
  const activeBuiltinPrompts = builtinPrompts ?? DEFAULT_PROMPTS;
  // Default prompts only shown when no API questions exist (FolderBookmark context)
  const showDefaultPrompts = possibleQuestions.length === 0;

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

            {/* Show loading dots when requesting and no streaming text yet */}
            {isRequesting && !streamingText && (
              <div className={`${styles.message} ${styles.assistantMessage} ${styles.loadingMessage}`}>
                <LoadingDots size="medium" />
              </div>
            )}

            {/* Show streaming assistant response */}
            {streamingText && streamingText.trim().length > 0 && (
              <div className={`${styles.message} ${styles.assistantMessage}`}>
                <ReactMarkdown components={markdownComponents}>
                  {streamingText}
                </ReactMarkdown>
                <span className={styles.cursor}>|</span>
              </div>
            )}

            {/* Possible questions below the last assistant content (chat history mode) */}
            {possibleQuestions.length > 0 && !isRequesting && (
              <div className={styles.suggestedQuestions}>
                {possibleQuestions.map((question, index) => (
                  <button
                    key={index}
                    type="button"
                    className={styles.questionItem}
                    onClick={() => onInputSubmitRef.current?.(question)}
                  >
                    <PlusIcon className={styles.questionIcon} />
                    <span className={styles.questionText}>{question}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Show initial streaming response or loading when no chat history */}
        {!hasChatHistory && (
          <>
            {isRequesting && !streamingText && (
              <div className={styles.loadingContainer}>
                <LoadingDots size="medium" />
              </div>
            )}
            {streamingText && streamingText.trim().length > 0 && (
              <div className={styles.explanationContent}>
                <ReactMarkdown components={markdownComponents}>
                  {streamingText}
                </ReactMarkdown>
              </div>
            )}
            {/* Possible questions below initial explanation (no chat history yet) */}
            {possibleQuestions.length > 0 && !isRequesting && (
              <div className={styles.suggestedQuestions}>
                {possibleQuestions.map((question, index) => (
                  <button
                    key={index}
                    type="button"
                    className={styles.questionItem}
                    onClick={() => onInputSubmitRef.current?.(question)}
                  >
                    <PlusIcon className={styles.questionIcon} />
                    <span className={styles.questionText}>{question}</span>
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Default Prompts - shown only when no API questions are available */}
      {showDefaultPrompts && (
        <div className={styles.defaultPrompts}>
          <span className={styles.promptsContainer}>
            {/* 3-dot button with hover popover */}
            <div
              className={styles.panelOptionsWrapper}
              onMouseEnter={() => {
                if (panelPopoverTimerRef.current) clearTimeout(panelPopoverTimerRef.current);
                setShowPanelPopover(true);
              }}
              onMouseLeave={() => {
                panelPopoverTimerRef.current = setTimeout(() => setShowPanelPopover(false), 200);
              }}
            >
              <button
                type="button"
                className={styles.panelOptionsButton}
                aria-label="More prompts"
              >
                <MoreVertical size={15} />
              </button>
              {showPanelPopover && (
                <div
                  className={styles.panelOptionsPopover}
                  onMouseEnter={() => {
                    if (panelPopoverTimerRef.current) clearTimeout(panelPopoverTimerRef.current);
                  }}
                  onMouseLeave={() => {
                    panelPopoverTimerRef.current = setTimeout(() => setShowPanelPopover(false), 200);
                  }}
                >
                  {activeBuiltinPrompts.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      className={styles.panelOptionItem}
                      onClick={() => { setShowPanelPopover(false); handlePromptClick(prompt); }}
                    >
                      {prompt}
                    </button>
                  ))}
                  {customPrompts && customPrompts.length > 0 && (
                    <>
                      <hr className={styles.panelOptionsSeparator} />
                      {customPrompts.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          className={styles.panelOptionItem}
                          onClick={() => {
                            setShowPanelPopover(false);
                            const text = stripHtml(p.description) || p.title;
                            onInputSubmit?.(text);
                          }}
                        >
                          <BookMarked size={13} />
                          <span>{p.title}</span>
                        </button>
                      ))}
                    </>
                  )}
                  {onAddCustomPrompt && (
                    <button
                      type="button"
                      className={styles.panelOptionItem}
                      onClick={() => { setShowPanelPopover(false); onAddCustomPrompt(); }}
                    >
                      <Plus size={13} />
                      <span>Add custom prompt</span>
                    </button>
                  )}
                  <a
                    href="/user/account/custom-prompt"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.panelOptionItem}
                    onClick={() => setShowPanelPopover(false)}
                  >
                    <ExternalLink size={13} />
                    <span>View all custom prompts</span>
                  </a>
                </div>
              )}
            </div>

            {activeBuiltinPrompts.map((prompt) => (
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
            ref={inputRef}
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
            <Square size={18} />
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
            <ArrowUp size={18} />
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
            <Trash2 size={18} />
          </button>
        )}
      </div>
    </div>
  );
};

function PlusIcon({ className }: { className?: string }) {
  return <Plus size={14} aria-hidden="true" className={className} />;
}

AskAISidePanelView.displayName = 'AskAISidePanelView';

