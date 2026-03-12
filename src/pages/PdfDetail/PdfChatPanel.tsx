import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  ChevronRight,
  ChevronDown,
  Plus,
  Trash2,
  Square,
  ArrowUp,
  Pencil,
  X,
  MessageCircle,
  Check,
} from 'lucide-react';
import { LoadingDots } from '@/shared/components/LoadingDots';
import { usePdfChat } from './usePdfChat';
import type { PdfChatCitationItem, PdfChatSessionResponse } from '@/shared/types/pdfChat.types';
import styles from './PdfChatPanel.module.css';

export interface PdfChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  pdfId: string;
  accessToken: string | null;
  onScrollToPage?: (pageNumber: number) => void;
  selectedText?: string;
  onClearSelectedText?: () => void;
}

const MIN_WIDTH = 300;
const MAX_WIDTH = 800;
const DEFAULT_WIDTH = 560;
const STORAGE_KEY = 'pdfChatPanelWidth';

function getPersistedWidth(): number {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = Number(stored);
      if (!Number.isNaN(parsed) && parsed >= MIN_WIDTH && parsed <= MAX_WIDTH) return parsed;
    }
  } catch { /* noop */ }
  return DEFAULT_WIDTH;
}

export const PdfChatPanel: React.FC<PdfChatPanelProps> = ({
  isOpen,
  onClose,
  pdfId,
  accessToken,
  onScrollToPage,
  selectedText,
  onClearSelectedText,
}) => {
  const [width, setWidth] = useState(getPersistedWidth);
  const [isSlidingOut, setIsSlidingOut] = useState(false);
  const [sessionDropdownOpen, setSessionDropdownOpen] = useState(false);
  const [renamingSessionId, setRenamingSessionId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

  const chatAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const chat = usePdfChat(pdfId, accessToken, isOpen);

  // --- Resize ---
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
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
  }, [width]);

  // --- Slide out ---
  const handleSlideOut = useCallback(() => {
    setIsSlidingOut(true);
    setTimeout(() => {
      onClose();
      setIsSlidingOut(false);
    }, 300);
  }, [onClose]);

  // --- Close dropdown on outside click ---
  useEffect(() => {
    if (!sessionDropdownOpen) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setSessionDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [sessionDropdownOpen]);

  // --- Auto-scroll ---
  const SCROLL_THRESHOLD = 5;
  useEffect(() => {
    const container = chatAreaRef.current;
    if (!container) return;
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      setShouldAutoScroll(scrollTop >= scrollHeight - clientHeight - SCROLL_THRESHOLD);
    };
    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (chatAreaRef.current && shouldAutoScroll && (chat.streamingText || chat.messages.length > 0)) {
      chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
    }
  }, [chat.streamingText, chat.messages, shouldAutoScroll]);

  // --- Submit ---
  const handleSubmit = useCallback(() => {
    const q = inputValue.trim();
    if (!q) return;
    setInputValue('');
    setShouldAutoScroll(true);
    chat.askQuestion(q, selectedText || undefined);
    onClearSelectedText?.();
  }, [inputValue, chat, selectedText, onClearSelectedText]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

  // --- Prompt click ---
  const handlePromptClick = useCallback((prompt: string) => {
    setShouldAutoScroll(true);
    chat.askQuestion(prompt, selectedText || undefined);
    onClearSelectedText?.();
  }, [chat, selectedText, onClearSelectedText]);

  // --- Session rename ---
  const startRename = useCallback((session: PdfChatSessionResponse) => {
    setRenamingSessionId(session.id);
    setRenameValue(session.name);
    setSessionDropdownOpen(false);
  }, []);

  const confirmRename = useCallback(() => {
    if (renamingSessionId && renameValue.trim()) {
      chat.renameSession(renamingSessionId, renameValue.trim());
    }
    setRenamingSessionId(null);
    setRenameValue('');
  }, [renamingSessionId, renameValue, chat]);

  const cancelRename = useCallback(() => {
    setRenamingSessionId(null);
    setRenameValue('');
  }, []);

  // --- Citation click ---
  const handleCitationClick = useCallback((citation: PdfChatCitationItem) => {
    if (citation.pageNumber && onScrollToPage) {
      onScrollToPage(citation.pageNumber);
    }
  }, [onScrollToPage]);

  // --- Markdown components ---
  const markdownComponents = useMemo(() => ({
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

  // --- Group sessions by owner_label for shared PDFs ---
  const groupedSessions = useMemo(() => {
    const groups: Record<string, PdfChatSessionResponse[]> = {};
    for (const session of chat.sessions) {
      const label = session.owner_label || 'My Sessions';
      if (!groups[label]) groups[label] = [];
      groups[label].push(session);
    }
    return groups;
  }, [chat.sessions]);

  const hasChatHistory = chat.messages.length > 0;
  const showPrompts = !hasChatHistory && !chat.isRequesting && chat.possibleQuestions.length === 0;

  const panelClasses = [
    styles.panel,
    isOpen ? styles.panelOpen : '',
    isSlidingOut ? styles.panelSlidingOut : '',
  ].filter(Boolean).join(' ');

  return (
    <div
      className={panelClasses}
      style={{ '--panel-width': `${width}px` } as React.CSSProperties}
    >
      <div className={styles.resizeHandle} onMouseDown={handleResizeStart} />

      {/* ── Header ── */}
      <div className={styles.header}>
        <button
          type="button"
          className={styles.slideOutBtn}
          onClick={handleSlideOut}
          aria-label="Close panel"
        >
          <ChevronRight size={18} />
        </button>
        <h3 className={styles.headerTitle}>Chat with PDF</h3>
        <div className={styles.headerSpacer} />
        <div className={styles.headerActions}>
          {hasChatHistory && (
            <div className={styles.headerBtnWrapper}>
              <button
                type="button"
                className={styles.headerIconBtn}
                onClick={chat.clearChat}
                aria-label="Clear chat"
              >
                <Trash2 size={16} />
              </button>
              <span className={styles.headerTooltip}>Clear chat</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Session bar ── */}
      {chat.preprocessStatus === 'COMPLETED' && (
        <div className={styles.sessionBar}>
          <div className={styles.sessionSelector} ref={dropdownRef}>
            {renamingSessionId === chat.activeSession?.id ? (
              <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                <input
                  className={styles.renameInput}
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') confirmRename();
                    if (e.key === 'Escape') cancelRename();
                  }}
                  autoFocus
                />
                <button type="button" className={styles.sessionItemBtn} onClick={confirmRename}>
                  <Check size={14} />
                </button>
                <button type="button" className={styles.sessionItemBtn} onClick={cancelRename}>
                  <X size={14} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                className={styles.sessionSelectorBtn}
                onClick={() => setSessionDropdownOpen((v) => !v)}
              >
                <span className={styles.sessionSelectorBtnText}>
                  {chat.activeSession?.name || 'Select session'}
                </span>
                <ChevronDown size={14} />
              </button>
            )}

            {sessionDropdownOpen && (
              <div className={styles.sessionDropdown}>
                {Object.entries(groupedSessions).map(([label, sessions]) => (
                  <div key={label}>
                    {Object.keys(groupedSessions).length > 1 && (
                      <div className={styles.sessionGroupLabel}>{label}</div>
                    )}
                    {sessions.map((session) => (
                      <div
                        key={session.id}
                        className={`${styles.sessionItem} ${session.id === chat.activeSession?.id ? styles.sessionItemActive : ''}`}
                        onClick={() => {
                          chat.switchSession(session.id);
                          setSessionDropdownOpen(false);
                        }}
                      >
                        <span className={styles.sessionItemName}>{session.name}</span>
                        <div className={styles.sessionItemActions}>
                          <button
                            type="button"
                            className={styles.sessionItemBtn}
                            onClick={(e) => { e.stopPropagation(); startRename(session); }}
                            aria-label="Rename"
                          >
                            <Pencil size={12} />
                          </button>
                          <button
                            type="button"
                            className={`${styles.sessionItemBtn} ${styles.sessionItemDeleteBtn}`}
                            onClick={(e) => { e.stopPropagation(); chat.deleteSession(session.id); setSessionDropdownOpen(false); }}
                            aria-label="Delete"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className={styles.headerBtnWrapper}>
            <button
              type="button"
              className={styles.newSessionBtn}
              onClick={chat.createSession}
              aria-label="New chat session"
            >
              <Plus size={16} />
            </button>
            <span className={styles.headerTooltip}>New chat</span>
          </div>
        </div>
      )}

      {/* ── Preprocessing state ── */}
      {chat.isPreprocessing && (
        <div className={styles.preprocessOverlay}>
          <div className={styles.spinner} />
          <p className={styles.preprocessTitle}>Preparing your PDF for chat</p>
          <p className={styles.preprocessSubtitle}>
            We&apos;re analyzing the document content. This usually takes a few seconds.
          </p>
        </div>
      )}

      {(chat.preprocessStatus === 'FAILED' || (!chat.preprocessStatus && chat.preprocessError)) && (
        <div className={styles.preprocessOverlay}>
          <p className={styles.preprocessTitle}>Preprocessing failed</p>
          <p className={styles.preprocessErrorText}>{chat.preprocessError}</p>
          <button type="button" className={styles.retryBtn} onClick={chat.retryPreprocess}>
            Retry
          </button>
        </div>
      )}

      {/* ── Chat area ── */}
      {chat.preprocessStatus === 'COMPLETED' && (
        <>
          <div ref={chatAreaRef} className={styles.chatArea}>
            {hasChatHistory && (
              <div className={styles.messagesContainer}>
                {chat.messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`${styles.message} ${msg.role === 'user' ? styles.userMessage : styles.assistantMessage}`}
                  >
                    {msg.role === 'user' && msg.selectedText && (
                      <span className={styles.selectedTextQuote}>
                        &ldquo;{msg.selectedText.length > 120 ? msg.selectedText.slice(0, 120) + '...' : msg.selectedText}&rdquo;
                      </span>
                    )}
                    {msg.role === 'assistant' ? (
                      <>
                        <ReactMarkdown components={markdownComponents}>{msg.content}</ReactMarkdown>
                        {msg.citations && msg.citations.length > 0 && (
                          <div className={styles.citationsRow}>
                            {msg.citations.map((cit, ci) => (
                              <button
                                key={ci}
                                type="button"
                                className={styles.citationBadge}
                                onClick={() => handleCitationClick(cit)}
                              >
                                {ci + 1}
                                <span className={styles.citationTooltip}>
                                  {cit.pageNumber && <span className={styles.citationPage}>Page {cit.pageNumber}</span>}
                                  {cit.content.length > 200 ? cit.content.slice(0, 200) + '...' : cit.content}
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      msg.content
                    )}
                  </div>
                ))}

                {chat.isRequesting && !chat.streamingText && (
                  <div className={`${styles.message} ${styles.assistantMessage} ${styles.loadingMessage}`}>
                    <LoadingDots size="medium" />
                  </div>
                )}

                {chat.streamingText && chat.streamingText.trim().length > 0 && (
                  <div className={`${styles.message} ${styles.assistantMessage}`}>
                    <ReactMarkdown components={markdownComponents}>{chat.streamingText}</ReactMarkdown>
                    <span className={styles.cursor}>|</span>
                  </div>
                )}

                {chat.possibleQuestions.length > 0 && !chat.isRequesting && (
                  <div className={styles.suggestedQuestions}>
                    {chat.possibleQuestions.map((q, qi) => (
                      <button
                        key={qi}
                        type="button"
                        className={styles.questionItem}
                        onClick={() => handlePromptClick(q)}
                      >
                        <Plus size={14} aria-hidden="true" className={styles.questionIcon} />
                        <span className={styles.questionText}>{q}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {!hasChatHistory && !chat.isRequesting && (
              <div className={styles.emptyState}>
                <MessageCircle size={40} className={styles.emptyIcon} />
                <p className={styles.emptyTitle}>Ask anything about this PDF</p>
                <p className={styles.emptySubtitle}>
                  Get answers, summaries, and insights from the document content.
                </p>
              </div>
            )}

            {!hasChatHistory && chat.isRequesting && !chat.streamingText && (
              <div className={styles.preprocessOverlay}>
                <LoadingDots size="medium" />
              </div>
            )}

            {!hasChatHistory && chat.streamingText && chat.streamingText.trim().length > 0 && (
              <div style={{ padding: '8px 0' }}>
                <ReactMarkdown components={markdownComponents}>{chat.streamingText}</ReactMarkdown>
                <span className={styles.cursor}>|</span>
              </div>
            )}
          </div>

          {/* Builtin prompts */}
          {showPrompts && (
            <div className={styles.promptRow}>
              <button type="button" className={styles.promptPill} onClick={() => handlePromptClick('Summarise this document')}>
                Summarise
              </button>
              <button type="button" className={styles.promptPill} onClick={() => handlePromptClick('What are the key takeaways from this document?')}>
                Key takeaways
              </button>
            </div>
          )}

          {/* Selected text indicator */}
          {selectedText && (
            <div className={styles.selectedTextBar}>
              <span className={styles.selectedTextBarLabel}>Selected:</span>
              <span className={styles.selectedTextBarText}>{selectedText}</span>
              <button type="button" className={styles.selectedTextBarClose} onClick={onClearSelectedText}>
                <X size={12} />
              </button>
            </div>
          )}

          {/* Input bar */}
          <div className={styles.inputBar}>
            <div className={styles.inputWrapper}>
              <input
                ref={inputRef}
                type="text"
                className={styles.input}
                placeholder="Ask about this PDF..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyPress}
              />
            </div>
            {chat.isRequesting ? (
              <button
                type="button"
                className={styles.stopButton}
                onClick={chat.stopRequest}
                aria-label="Stop"
              >
                <Square size={18} />
              </button>
            ) : (
              <button
                type="button"
                className={styles.sendButton}
                onClick={handleSubmit}
                disabled={!inputValue.trim()}
                aria-label="Send"
              >
                <ArrowUp size={18} />
              </button>
            )}
            {hasChatHistory && !chat.isRequesting && (
              <button
                type="button"
                className={styles.clearButton}
                onClick={chat.clearChat}
                aria-label="Clear chat"
              >
                <Trash2 size={18} />
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
};

PdfChatPanel.displayName = 'PdfChatPanel';
