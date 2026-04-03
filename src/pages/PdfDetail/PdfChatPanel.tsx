import React, { useState, useCallback, useEffect, useRef, useMemo, createContext, useContext } from 'react';
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
  ExternalLink,
  EyeOff,
  Share2,
  BookMarked,
  Loader2,
} from 'lucide-react';
import { deleteCustomPrompt, setCustomPromptHidden, shareCustomPrompt } from '@/shared/services/customPrompt.service';
import type { CustomPromptResponse } from '@/shared/types/customPrompt.types';
import { CreateCustomPromptModal } from '@/shared/components/CreateCustomPromptModal/CreateCustomPromptModal';
import { LoadingDots } from '@/shared/components/LoadingDots';
import { usePdfChat } from './usePdfChat';
import type { PdfChatCitationItem, PdfChatSessionResponse } from '@/shared/types/pdfChat.types';
import { stripMarkdown, normalisePdfText } from './pdfTextNormalise';
import styles from './PdfChatPanel.module.css';

export interface PdfChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  pdfId: string;
  accessToken: string | null;
  onScrollToPage?: (pageNumber: number) => void;
  selectedText?: string;
  onClearSelectedText?: () => void;
  /** A prompt that should be auto-submitted to the chat as soon as the session is ready. */
  pendingPrompt?: string;
  onClearPendingPrompt?: () => void;
  /** Called when the user clicks the ref button next to a quoted selection — scrolls + pulses the text in the PDF. */
  onScrollToSelectedText?: (text: string, pageHint?: number | null, noPulse?: boolean) => void;
  /** Called when a citation is clicked to show/clear a persistent highlight band on the PDF. Pass null to clear. */
  onHighlightCitation?: (h: { id: string; startText: string; endText: string; pageNumber?: number } | null) => void;
  customPrompts?: CustomPromptResponse[];
  onCreatePrompt?: () => void;
  onCustomPromptsChanged?: (prompts: CustomPromptResponse[]) => void;
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

// Replaces citation markers with [k](#citation:N) markdown links,
// skipping content inside fenced code blocks and inline code spans.
// Handles two strict formats:
//   [Chunk N]  / [Chunk N, page P] — legacy format the context is labelled with
//   [N] / [N:P]                    — primary format emitted by the LLM
// Bare "[digits followed by non-citation text]" like "[10 patients]" are NOT matched.
function buildCitedText(text: string): string {
  const seen = new Map<number, number>();
  let counter = 0;
  const parts = text.split(/(```[\s\S]*?```|`[^`\n]+`)/g);
  // Two strict alternations:
  //   \[Chunk\s+(\d+)[^\]]*\]  — matches "[Chunk N ...]" (legacy)
  //   \[(\d+)(?::\d+)?\]       — matches "[N]" or "[N:P]" (LLM output, digits only)
  const CITATION_RE = /\[Chunk\s+(\d+)[^\]]*\]|\[(\d+)(?::\d+)?\]/g;
  return parts
    .map((part, i) => {
      if (i % 2 === 1) return part;
      return part.replace(CITATION_RE, (_, g1, g2) => {
        const n = parseInt(g1 ?? g2, 10);
        if (!seen.has(n)) seen.set(n, ++counter);
        return `[${seen.get(n)}](#citation:${n})`;
      });
    })
    .join('');
}

// Context that lets CitationBadge always read the live isRequesting value directly,
// bypassing any ReactMarkdown memoization of its rendered subtree.
const ChatRequestingContext = createContext(false);

const CitationBadge: React.FC<{
  cit: PdfChatCitationItem | undefined;
  onCitClick: (c: PdfChatCitationItem) => void;
  href: string;
  chunkSeq: number;
  citationsCount: number;
  children: React.ReactNode;
}> = ({ cit, onCitClick, href, chunkSeq, citationsCount, children }) => {
  const isRequesting = useContext(ChatRequestingContext);
  const btnRef = useRef<HTMLButtonElement>(null);
  const [hovered, setHovered] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    if (isRequesting || !hovered || !btnRef.current || !cit) { setPos(null); return; }
    const rect = btnRef.current.getBoundingClientRect();
    const tooltipW = 260;
    let left = rect.left + rect.width / 2 - tooltipW / 2;
    if (left < 4) left = 4;
    if (left + tooltipW > window.innerWidth - 4) left = window.innerWidth - 4 - tooltipW;
    setPos({ top: rect.top - 8, left });
  }, [hovered, cit, isRequesting]);

  return (
    <button
      ref={btnRef}
      type="button"
      className={`${styles.inlineCitationBadge}${isRequesting ? ` ${styles.inlineCitationBadgeDisabled}` : ''}`}
      onMouseEnter={() => { if (!isRequesting) setHovered(true); }}
      onMouseLeave={() => setHovered(false)}
      onClick={(e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (isRequesting || !cit) return;
        console.log('[Citation click]', { href, chunkSeq, cit, citationsCount });
        onCitClick(cit);
      }}
    >
      {children}
      {!isRequesting && cit && hovered && pos && createPortal(
        <span
          className={`${styles.citationTooltipPortal} ${styles.citationTooltipPortalVisible}`}
          style={{ top: pos.top, left: pos.left, transform: 'translateY(-100%)' }}
        >
          {cit.pageNumber && <span className={styles.citationPage}>Page {cit.pageNumber}</span>}
          {cit.content.length > 200 ? cit.content.slice(0, 200) + '...' : cit.content}
        </span>,
        document.body,
      )}
    </button>
  );
};

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
        let cit = citations.find((c) => c.chunkSequence === chunkSeq);
        if (!cit && chunkSeq >= 1 && chunkSeq <= citations.length) {
          cit = citations[chunkSeq - 1];
        }
        return (
          <CitationBadge
            cit={cit}
            onCitClick={onCitClick}
            href={href}
            chunkSeq={chunkSeq}
            citationsCount={citations.length}
          >
            {children}
          </CitationBadge>
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
  pendingPrompt,
  onClearPendingPrompt,
  onScrollToSelectedText,
  onHighlightCitation,
  customPrompts = [],
  onCreatePrompt,
  onCustomPromptsChanged,
}) => {
  const [width, setWidth] = useState(getPersistedWidth);
  const [renamingSessionId, setRenamingSessionId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [sessionListDropdownOpen, setSessionListDropdownOpen] = useState(false);
  const [hiddenSessionIds, setHiddenSessionIds] = useState<Set<string>>(new Set());
  const [confirmDeleteSessionId, setConfirmDeleteSessionId] = useState<string | null>(null);
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null);
  const [openMenuSessionId, setOpenMenuSessionId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const [customPromptMenuOpen, setCustomPromptMenuOpen] = useState(false);
  const [customPromptActionMenuId, setCustomPromptActionMenuId] = useState<string | null>(null);
  const [customPromptActionMenuPos, setCustomPromptActionMenuPos] = useState<{ top: number; right: number } | null>(null);
  const [editingPrompt, setEditingPrompt] = useState<CustomPromptResponse | null>(null);
  const [confirmDeletePromptId, setConfirmDeletePromptId] = useState<string | null>(null);
  const [sharingPrompt, setSharingPrompt] = useState<CustomPromptResponse | null>(null);
  const [shareUserId, setShareUserId] = useState('');
  const [shareLoading, setShareLoading] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);
  const [activeCitationId, setActiveCitationId] = useState<string | null>(null);

  const chatAreaRef = useRef<HTMLDivElement>(null);
  const lastUserMsgRef = useRef<HTMLDivElement>(null);
  const prevUserMsgCountRef = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const sessionListRef = useRef<HTMLDivElement>(null);
  const customPromptMenuRef = useRef<HTMLDivElement>(null);

  const chat = usePdfChat(pdfId, accessToken, isOpen);

  // Auto-submit a pending prompt (from preset/custom prompts picked on text selection)
  // as soon as the session is ready and not already processing a request.
  useEffect(() => {
    if (
      !pendingPrompt ||
      chat.preprocessStatus !== 'COMPLETED' ||
      !chat.activeSession ||
      chat.isRequesting
    ) return;
    chat.askQuestion(pendingPrompt, selectedText || undefined);
    onClearSelectedText?.();
    onClearPendingPrompt?.();
  }, [pendingPrompt, chat.preprocessStatus, chat.activeSession, chat.isRequesting]);

  // Auto-focus the chat input when "Ask AI" is triggered from a text selection.
  useEffect(() => {
    if (!isOpen || !selectedText) return;
    const timer = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(timer);
  }, [isOpen, selectedText]);

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

  // Scroll the chat so the latest user message sits at ~38% from the top of the
  // container whenever a new user message is added. After that one-time scroll
  // no further auto-scrolling happens — streaming content that flows past the
  // bottom border is intentionally not chased.
  useEffect(() => {
    const userMsgCount = chat.messages.filter((m) => m.role === 'user').length;
    if (userMsgCount > prevUserMsgCountRef.current) {
      prevUserMsgCountRef.current = userMsgCount;
      const container = chatAreaRef.current;
      const lastMsg = lastUserMsgRef.current;
      if (container && lastMsg) {
        const targetScrollTop = lastMsg.offsetTop - container.clientHeight * 0.5;
        container.scrollTop = Math.max(0, targetScrollTop);
      }
    }
  }, [chat.messages]);

  // Clear citation highlight whenever the active session changes
  useEffect(() => {
    prevUserMsgCountRef.current = 0;
    setActiveCitationId(null);
    onHighlightCitation?.(null);
  }, [chat.activeSession?.id]);

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

  useEffect(() => {
    if (!customPromptMenuOpen) return;
    const handler = (e: MouseEvent) => {
      if (customPromptMenuRef.current && !customPromptMenuRef.current.contains(e.target as Node)) {
        setCustomPromptMenuOpen(false);
        setCustomPromptActionMenuId(null);
        setCustomPromptActionMenuPos(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [customPromptMenuOpen]);

  const closeActionMenu = () => {
    setCustomPromptActionMenuId(null);
    setCustomPromptActionMenuPos(null);
  };

  // --- Submit ---
  const handleSubmit = useCallback(() => {
    const q = inputValue.trim();
    if (!q) return;
    setInputValue('');
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
  const stripHtml = (html: string): string => {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return (tmp.textContent ?? tmp.innerText ?? '').replace(/\s+/g, ' ').trim();
  };

  const handlePromptClick = useCallback((displayText: string, apiContent?: string) => {
    chat.askQuestion(displayText, selectedText || undefined, apiContent);
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
    const citId = String(citation.chunkSequence);

    if (activeCitationId === citId) {
      setActiveCitationId(null);
      onHighlightCitation?.(null);
      return;
    }

    const cleanText = normalisePdfText(stripMarkdown(citation.content));
    const startText = cleanText;
    const endText = cleanText;

    setActiveCitationId(citId);
    onHighlightCitation?.({ id: citId, startText, endText, pageNumber: citation.pageNumber ?? undefined });

    // Scroll: immediately jump to the page (ensures the page is visible and
    // its text layer is rendered), then after a short delay scroll precisely
    // to the matched text span so the highlighted text is centred in view.
    const pageHint = citation.pageNumber ?? null;
    if (pageHint != null && onScrollToPage) {
      onScrollToPage(pageHint);
    }
    if (onScrollToSelectedText) {
      setTimeout(() => onScrollToSelectedText(cleanText, pageHint, true), 350);
    }
  }, [activeCitationId, onScrollToPage, onHighlightCitation, onScrollToSelectedText]);

  // Stable components for streaming (no citations available yet)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const streamingMarkdownComponents = useMemo(() => makeMarkdownComponents([], () => {}), []);

  const hasChatHistory = chat.messages.length > 0;
  const promptsDisabled = chat.isRequesting;

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
            <div className={`${styles.sessionListDropdown} ${sessionListDropdownOpen ? styles.sessionListDropdownOpen : ''}`}>
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
                disabled={deletingSessionId === confirmDeleteSessionId}
                onClick={async () => {
                  setDeletingSessionId(confirmDeleteSessionId);
                  await chat.deleteSession(confirmDeleteSessionId);
                  setDeletingSessionId(null);
                  setConfirmDeleteSessionId(null);
                }}
              >
                {deletingSessionId === confirmDeleteSessionId
                  ? <Loader2 size={14} className={styles.spinRed} />
                  : 'Delete'}
              </button>
              <button
                type="button"
                className={styles.confirmCancelBtn}
                disabled={deletingSessionId === confirmDeleteSessionId}
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
        <ChatRequestingContext.Provider value={chat.isRequesting}>
        <>
          <div ref={chatAreaRef} className={styles.chatArea}>
            {hasChatHistory && (
              <div className={styles.messagesContainer}>
                {chat.messages.map((msg, i) => {
                  const isLastUserMsg =
                    msg.role === 'user' &&
                    !chat.messages.slice(i + 1).some((m) => m.role === 'user');
                  return (
                  <div
                    key={i}
                    ref={isLastUserMsg ? lastUserMsgRef : undefined}
                    className={`${styles.message} ${msg.role === 'user' ? styles.userMessage : styles.assistantMessage}`}
                  >
                    {msg.role === 'user' && msg.selectedText && (
                      <span className={styles.selectedTextQuoteWrapper}>
                        <span
                          className={`${styles.selectedTextQuote}${onScrollToSelectedText ? ` ${styles.selectedTextQuoteClickable}` : ''}`}
                          title={onScrollToSelectedText ? 'Go to text in PDF' : undefined}
                          onClick={onScrollToSelectedText ? () => onScrollToSelectedText(msg.selectedText!) : undefined}
                        >
                          &ldquo;{msg.selectedText.length > 120 ? msg.selectedText.slice(0, 120) + '...' : msg.selectedText}&rdquo;
                        </span>
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
                  );
                })}

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

          {/* Builtin prompts + custom prompt controls */}
          <div className={`${styles.promptRow} ${promptsDisabled ? styles.promptRowDisabled : ''}`}>
              {/* + create prompt button */}
              <div className={styles.tooltipWrap}>
                <button
                  type="button"
                  className={styles.promptAddBtn}
                  onClick={onCreatePrompt}
                  aria-label="Create prompt"
                >
                  <Plus size={13} />
                </button>
                <span className={`${styles.tooltip} ${styles.tooltipAbove}`}>Create prompt</span>
              </div>

              {/* ... custom prompts button — right next to + */}
              {customPrompts.length > 0 && (
                <div className={styles.customPromptMenuWrap} ref={customPromptMenuRef}>
                  <div className={styles.tooltipWrap}>
                    <button
                      type="button"
                      className={`${styles.promptAddBtn} ${customPromptMenuOpen ? styles.promptAddBtnActive : ''}`}
                      onClick={() => { setCustomPromptMenuOpen((v) => !v); setCustomPromptActionMenuId(null); setCustomPromptActionMenuPos(null); }}
                      aria-label="Custom prompts"
                    >
                      <MoreHorizontal size={13} />
                    </button>
                    <span className={`${styles.tooltip} ${styles.tooltipAbove}`}>Custom prompts</span>
                  </div>

                  <div className={`${styles.customPromptDropdown} ${customPromptMenuOpen ? styles.customPromptDropdownOpen : ''}`}>
                      <div className={styles.customPromptDropdownList}>
                        {customPrompts.map((p) => (
                          <div key={p.id} className={styles.customPromptItem}>
                            <button
                              type="button"
                              className={styles.customPromptItemTitle}
                              onClick={() => {
                                handlePromptClick(p.title, p.description ? stripHtml(p.description) : p.title);
                                setCustomPromptMenuOpen(false);
                              }}
                            >
                              <BookMarked size={13} />
                              <span>{p.title}</span>
                            </button>
                            <button
                              type="button"
                              className={styles.customPromptItemMenuBtn}
                              onClick={(e) => {
                                e.stopPropagation();
                                const rect = e.currentTarget.getBoundingClientRect();
                                const isOpening = customPromptActionMenuId !== p.id;
                                setCustomPromptActionMenuId(isOpening ? p.id : null);
                                setCustomPromptActionMenuPos(isOpening ? { top: rect.bottom + 4, right: window.innerWidth - rect.right } : null);
                              }}
                              aria-label="Prompt options"
                            >
                              <MoreHorizontal size={13} />
                            </button>
                          </div>
                        ))}
                      </div>
                      <div className={styles.customPromptDropdownFooter}>
                        <button
                          type="button"
                          className={styles.customPromptFooterBtn}
                          onClick={() => { onCreatePrompt?.(); setCustomPromptMenuOpen(false); }}
                        >
                          <Plus size={13} />
                          <span>Add prompt</span>
                        </button>
                        <a
                          href="/user/account/custom-prompt"
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.customPromptFooterBtn}
                          onClick={() => setCustomPromptMenuOpen(false)}
                        >
                          <ExternalLink size={13} />
                          <span>Manage custom prompts</span>
                        </a>
                      </div>
                    </div>
                </div>
              )}

              {/* Builtin pills */}
              <button type="button" className={styles.promptPill} disabled={promptsDisabled} onClick={() => handlePromptClick('Summarise this document')}>
                Summarise
              </button>
              <button type="button" className={styles.promptPill} disabled={promptsDisabled} onClick={() => handlePromptClick('What are the key takeaways from this document?')}>
                Key takeaways
              </button>
            </div>

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
        </ChatRequestingContext.Provider>
      )}
      {customPromptActionMenuId && customPromptActionMenuPos && (() => {
        const activePrompt = customPrompts.find((p) => p.id === customPromptActionMenuId);
        if (!activePrompt) return null;
        return createPortal(
          <div
            className={styles.customPromptActionMenu}
            style={{ position: 'fixed', top: customPromptActionMenuPos.top, right: customPromptActionMenuPos.right }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className={styles.customPromptActionItem}
              onClick={() => { setEditingPrompt(activePrompt); closeActionMenu(); }}
            >
              <Pencil size={13} />
              <span>Edit</span>
            </button>
            <button
              type="button"
              className={styles.customPromptActionItem}
              onClick={async () => {
                try {
                  await setCustomPromptHidden(activePrompt.id, true);
                  onCustomPromptsChanged?.(customPrompts.filter((x) => x.id !== activePrompt.id));
                } catch { /* noop */ }
                closeActionMenu();
              }}
            >
              <EyeOff size={13} />
              <span>Hide</span>
            </button>
            <button
              type="button"
              className={styles.customPromptActionItem}
              onClick={() => { setSharingPrompt(activePrompt); setShareUserId(''); setShareError(null); closeActionMenu(); }}
            >
              <Share2 size={13} />
              <span>Share</span>
            </button>
            <button
              type="button"
              className={`${styles.customPromptActionItem} ${styles.customPromptActionItemDanger}`}
              onClick={() => { setConfirmDeletePromptId(activePrompt.id); closeActionMenu(); }}
            >
              <Trash2 size={13} />
              <span>Delete</span>
            </button>
          </div>,
          document.body,
        );
      })()}
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

      {/* Edit prompt modal */}
      <CreateCustomPromptModal
        isOpen={!!editingPrompt}
        existingPrompt={editingPrompt}
        onClose={() => setEditingPrompt(null)}
        onUpdated={(updated) => {
          onCustomPromptsChanged?.(customPrompts.map((p) => p.id === updated.id ? updated : p));
          setEditingPrompt(null);
        }}
      />

      {/* Share prompt modal */}
      {sharingPrompt && createPortal(
        <div className={styles.confirmOverlay} onMouseDown={() => { setSharingPrompt(null); setShareUserId(''); setShareError(null); }}>
          <div className={styles.confirmDialog} onMouseDown={(e) => e.stopPropagation()}>
            <p className={styles.confirmTitle}>Share &ldquo;{sharingPrompt.title}&rdquo;</p>
            <p className={styles.confirmBody}>Enter the user ID of the person you want to share this prompt with.</p>
            <input
              className={styles.confirmInput}
              type="text"
              placeholder="Enter email to share with"
              value={shareUserId}
              onChange={(e) => setShareUserId(e.target.value)}
              autoFocus
            />
            {shareError && <p className={styles.confirmError}>{shareError}</p>}
            <div className={styles.confirmActions}>
              <button
                type="button"
                className={styles.confirmCancelBtn}
                onClick={() => { setSharingPrompt(null); setShareUserId(''); setShareError(null); }}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.confirmPrimaryBtn}
                disabled={!shareUserId.trim() || shareLoading}
                onClick={async () => {
                  if (!shareUserId.trim()) return;
                  try {
                    setShareLoading(true);
                    setShareError(null);
                    await shareCustomPrompt(sharingPrompt.id, { sharedToUserId: shareUserId.trim() });
                    setSharingPrompt(null);
                    setShareUserId('');
                  } catch (err) {
                    setShareError(err instanceof Error ? err.message : 'Failed to share prompt');
                  } finally {
                    setShareLoading(false);
                  }
                }}
              >
                {shareLoading && <Loader2 size={13} className={styles.spin} />}
                Share
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}

      {/* Delete prompt confirmation */}
      {confirmDeletePromptId && createPortal(
        <div className={styles.confirmOverlay} onMouseDown={() => setConfirmDeletePromptId(null)}>
          <div className={styles.confirmDialog} onMouseDown={(e) => e.stopPropagation()}>
            <p className={styles.confirmTitle}>Delete prompt?</p>
            <p className={styles.confirmBody}>This action cannot be undone.</p>
            <div className={styles.confirmActions}>
              <button
                type="button"
                className={styles.confirmCancelBtn}
                onClick={() => setConfirmDeletePromptId(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.confirmDangerBtn}
                onClick={async () => {
                  try {
                    await deleteCustomPrompt(confirmDeletePromptId);
                    onCustomPromptsChanged?.(customPrompts.filter((x) => x.id !== confirmDeletePromptId));
                  } catch { /* noop */ }
                  setConfirmDeletePromptId(null);
                }}
              >
                <Trash2 size={13} />
                Delete
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
};

PdfChatPanel.displayName = 'PdfChatPanel';
