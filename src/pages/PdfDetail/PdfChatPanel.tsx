import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import ReactMarkdown from 'react-markdown';
import {
  Plus,
  Trash2,
  Square,
  ArrowUp,
  X,
  MessageCircle,
  ChevronRight,
  List,
  MoreHorizontal,
  Pencil,
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

// Replaces [Chunk N] / [Chunk N, page P] citation markers with [k](citation:N) markdown links,
// skipping content inside fenced code blocks and inline code spans.
function buildCitedText(text: string): string {
  const seen = new Map<number, number>();
  let counter = 0;
  const parts = text.split(/(```[\s\S]*?```|`[^`\n]+`)/g);
  return parts
    .map((part, i) => {
      if (i % 2 === 1) return part;
      return part.replace(/\[Chunk\s+(\d+)(?:[^\]]*)\]/g, (_, chunkSeq) => {
        const n = parseInt(chunkSeq, 10);
        if (!seen.has(n)) seen.set(n, ++counter);
        return `[${seen.get(n)}](#citation:${n})`;
      });
    })
    .join('');
}

function makeMarkdownComponents(
  citations: PdfChatCitationItem[],
  onCitClick: (c: PdfChatCitationItem) => void,
) {
  return {
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
    a: ({ href, children }: any) => {
      const citPrefix = '#citation:';
      if (href?.startsWith(citPrefix)) {
        const chunkSeq = parseInt(href.slice(citPrefix.length), 10);
        const cit = citations.find((c) => c.chunkSequence === chunkSeq);
        return (
          <button
            type="button"
            className={styles.inlineCitationBadge}
            onClick={(e: React.MouseEvent) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('[Citation click]', { href, chunkSeq, cit, citationsCount: citations.length });
              if (cit) onCitClick(cit);
            }}
          >
            {children}
            {cit && (
              <span className={styles.citationTooltip}>
                {cit.pageNumber && <span className={styles.citationPage}>Page {cit.pageNumber}</span>}
                {cit.content.length > 200 ? cit.content.slice(0, 200) + '...' : cit.content}
              </span>
            )}
          </button>
        );
      }
      return <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>;
    },
  };
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
  const [renamingSessionId, setRenamingSessionId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [sessionListDropdownOpen, setSessionListDropdownOpen] = useState(false);
  const [hiddenSessionIds, setHiddenSessionIds] = useState<Set<string>>(new Set());
  const [confirmDeleteSessionId, setConfirmDeleteSessionId] = useState<string | null>(null);
  const [openMenuSessionId, setOpenMenuSessionId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);

  const chatAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const sessionListRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (!sessionListDropdownOpen) return;
    const handler = (e: MouseEvent) => {
      if (sessionListRef.current && !sessionListRef.current.contains(e.target as Node)) {
        setSessionListDropdownOpen(false);
        setOpenMenuSessionId(null);
        setMenuPosition(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [sessionListDropdownOpen]);

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
    console.log('[handleCitationClick]', { pageNumber: citation.pageNumber, chunkSequence: citation.chunkSequence, hasOnScrollToPage: !!onScrollToPage });
    if (citation.pageNumber != null && onScrollToPage) {
      onScrollToPage(citation.pageNumber);
    }
  }, [onScrollToPage]);

  // Stable components for streaming (no citations available yet)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const streamingMarkdownComponents = useMemo(() => makeMarkdownComponents([], () => {}), []);

  const hasChatHistory = chat.messages.length > 0;
  const showPrompts = !hasChatHistory && !chat.isRequesting && chat.possibleQuestions.length === 0;

  const visibleSessions = useMemo(
    () => chat.sessions.filter((s) => !hiddenSessionIds.has(s.id)),
    [chat.sessions, hiddenSessionIds],
  );

  const hideTab = useCallback((sessionId: string) => {
    const sessionMessages = chat.messagesBySession[sessionId] ?? [];
    if (sessionMessages.length === 0) {
      chat.deleteSession(sessionId);
      return;
    }
    setHiddenSessionIds((prev) => {
      const next = new Set(prev);
      next.add(sessionId);
      return next;
    });
    if (chat.activeSession?.id === sessionId) {
      const remaining = visibleSessions.filter((s) => s.id !== sessionId);
      if (remaining.length > 0) {
        chat.switchSession(remaining[0].id);
      }
    }
  }, [chat, visibleSessions]);

  const showTab = useCallback((sessionId: string) => {
    setHiddenSessionIds((prev) => {
      const next = new Set(prev);
      next.delete(sessionId);
      return next;
    });
    chat.switchSession(sessionId);
  }, [chat]);

  const panelClasses = [
    styles.panel,
    isOpen ? styles.panelOpen : '',
  ].filter(Boolean).join(' ');

  return (
    <div
      className={panelClasses}
      style={{ '--panel-width': `${width}px` } as React.CSSProperties}
    >
      <div className={styles.resizeHandle} onMouseDown={handleResizeStart} />

      {/* ── Chrome-style session tabs ── */}
      {chat.preprocessStatus === 'COMPLETED' && (
        <div className={styles.tabBar}>
          <div className={styles.tabBarLeft} ref={sessionListRef}>
            <div className={styles.tooltipWrap}>
              <button
                type="button"
                className={styles.tabBarBtn}
                onClick={onClose}
                aria-label="Close panel"
              >
                <ChevronRight size={14} />
              </button>
              <span className={`${styles.tooltip} ${styles.tooltipLeft}`}>Close panel</span>
            </div>
            <div className={styles.tooltipWrap}>
              <button
                type="button"
                className={`${styles.tabBarBtn} ${sessionListDropdownOpen ? styles.tabBarBtnActive : ''}`}
                onClick={() => setSessionListDropdownOpen((v) => !v)}
                aria-label="All sessions"
              >
                <List size={14} />
              </button>
              <span className={`${styles.tooltip} ${styles.tooltipLeft}`}>All sessions</span>
            </div>
            {sessionListDropdownOpen && (
              <div className={styles.sessionListDropdown}>
                <div className={styles.sessionListScrollable}>
                  {chat.sessions.map((session) => {
                    const isHidden = hiddenSessionIds.has(session.id);
                    return (
                      <div
                        key={session.id}
                        className={`${styles.sessionListItem} ${session.id === chat.activeSession?.id ? styles.sessionListItemActive : ''} ${isHidden ? styles.sessionListItemHidden : ''}`}
                        onClick={() => {
                          if (isHidden) {
                            showTab(session.id);
                          } else {
                            chat.switchSession(session.id);
                          }
                          setSessionListDropdownOpen(false);
                        }}
                      >
                        <span className={styles.sessionListItemName}>{session.name}</span>
                        <div className={styles.sessionListMenuWrap}>
                          <button
                            type="button"
                            className={styles.sessionListMenuBtn}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (openMenuSessionId === session.id) {
                                setOpenMenuSessionId(null);
                                setMenuPosition(null);
                              } else {
                                const rect = e.currentTarget.getBoundingClientRect();
                                setMenuPosition({ top: rect.bottom + 4, left: rect.left });
                                setOpenMenuSessionId(session.id);
                              }
                            }}
                            aria-label="Session options"
                          >
                            <MoreHorizontal size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div
                  className={styles.sessionListNewChat}
                  onClick={() => {
                    chat.createSession();
                    setSessionListDropdownOpen(false);
                  }}
                >
                  <Plus size={14} />
                  <span>New chat</span>
                </div>
              </div>
            )}
          </div>
          <div className={styles.tabList}>
            {visibleSessions.map((session) => (
              <div
                key={session.id}
                className={`${styles.tab} ${session.id === chat.activeSession?.id ? styles.tabActive : ''}`}
                onClick={() => chat.switchSession(session.id)}
                onDoubleClick={() => startRename(session)}
              >
                {renamingSessionId === session.id ? (
                  <input
                    className={styles.tabRenameInput}
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') confirmRename();
                      if (e.key === 'Escape') cancelRename();
                    }}
                    onBlur={confirmRename}
                    onClick={(e) => e.stopPropagation()}
                    autoFocus
                  />
                ) : (
                  <span className={styles.tabName}>{session.name}</span>
                )}
                {visibleSessions.length > 1 && renamingSessionId !== session.id && (
                  <button
                    type="button"
                    className={styles.tabClose}
                    onClick={(e) => { e.stopPropagation(); hideTab(session.id); }}
                    aria-label="Close tab"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            ))}
          </div>
          <div className={styles.tabBarActions}>
            <div className={styles.tooltipWrap}>
              <button
                type="button"
                className={styles.tabBarBtn}
                onClick={chat.createSession}
                aria-label="New chat session"
              >
                <Plus size={14} />
              </button>
              <span className={`${styles.tooltip} ${styles.tooltipRight}`}>New chat</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete session confirmation dialog ── */}
      {confirmDeleteSessionId && (
        <div className={styles.confirmOverlay}>
          <div className={styles.confirmDialog}>
            <p className={styles.confirmText}>Delete this session permanently?</p>
            <div className={styles.confirmActions}>
              <button
                type="button"
                className={styles.confirmDeleteBtn}
                onClick={() => {
                  chat.deleteSession(confirmDeleteSessionId);
                  setConfirmDeleteSessionId(null);
                }}
              >
                Delete
              </button>
              <button
                type="button"
                className={styles.confirmCancelBtn}
                onClick={() => setConfirmDeleteSessionId(null)}
              >
                Cancel
              </button>
            </div>
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
                      <ReactMarkdown
                        components={makeMarkdownComponents(msg.citations ?? [], handleCitationClick)}
                      >
                        {buildCitedText(msg.content)}
                      </ReactMarkdown>
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
                    <ReactMarkdown components={streamingMarkdownComponents}>{buildCitedText(chat.streamingText)}</ReactMarkdown>
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
                <ReactMarkdown components={streamingMarkdownComponents}>{buildCitedText(chat.streamingText)}</ReactMarkdown>
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
              <div className={styles.tooltipWrap}>
                <button
                  type="button"
                  className={styles.clearButton}
                  onClick={chat.clearChat}
                  aria-label="Clear chat"
                >
                  <Trash2 size={18} />
                </button>
                <span className={`${styles.tooltip} ${styles.tooltipAbove}`}>Clear chat</span>
              </div>
            )}
          </div>
        </>
      )}
      {openMenuSessionId && menuPosition && (() => {
        const activeMenuSession = chat.sessions.find((s) => s.id === openMenuSessionId);
        if (!activeMenuSession) return null;
        return createPortal(
          <div
            className={styles.sessionListContextMenu}
            style={{ position: 'fixed', top: menuPosition.top, left: menuPosition.left }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className={`${styles.sessionListContextMenuItem} ${styles.sessionListContextMenuItemRename}`}
              onClick={() => {
                startRename(activeMenuSession);
                setOpenMenuSessionId(null);
                setMenuPosition(null);
                setSessionListDropdownOpen(false);
              }}
            >
              <Pencil size={13} />
              <span>Rename session</span>
            </button>
            <button
              type="button"
              className={`${styles.sessionListContextMenuItem} ${styles.sessionListContextMenuItemDelete}`}
              onClick={() => {
                setConfirmDeleteSessionId(activeMenuSession.id);
                setOpenMenuSessionId(null);
                setMenuPosition(null);
                setSessionListDropdownOpen(false);
              }}
            >
              <Trash2 size={13} />
              <span>Delete session</span>
            </button>
          </div>,
          document.body,
        );
      })()}
    </div>
  );
};

PdfChatPanel.displayName = 'PdfChatPanel';
