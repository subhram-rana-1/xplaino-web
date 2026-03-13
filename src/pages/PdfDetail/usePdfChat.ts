import { useState, useRef, useCallback, useEffect } from 'react';
import type {
  PdfContentPreprocessResponse,
  PdfChatSessionResponse,
  PdfChatMessageResponse,
  PreprocessStatus,
  ChatMessage,
} from '@/shared/types/pdfChat.types';
import {
  preprocessPdf,
  getPreprocessStatus,
  createChatSession,
  listChatSessions,
  renameChatSession,
  deleteChatSession,
  clearChatSessionMessages,
  getSessionChats,
  askPdf,
} from '@/shared/services/pdfChat.service';

const POLL_INTERVAL = 3000;

const lastSessionKey = (pdfId: string) => `pdf-chat-last-session-${pdfId}`;

const saveLastSession = (pdfId: string, sessionId: string) => {
  try { localStorage.setItem(lastSessionKey(pdfId), sessionId); } catch { /* noop */ }
};

const readLastSession = (pdfId: string): string | null => {
  try { return localStorage.getItem(lastSessionKey(pdfId)); } catch { return null; }
};

export interface UsePdfChatReturn {
  preprocessStatus: PreprocessStatus | null;
  preprocessError: string | null;
  isPreprocessing: boolean;

  sessions: PdfChatSessionResponse[];
  activeSession: PdfChatSessionResponse | null;

  messages: ChatMessage[];
  messagesBySession: Record<string, ChatMessage[]>;
  streamingText: string;
  possibleQuestions: string[];
  isRequesting: boolean;

  createSession: () => Promise<void>;
  switchSession: (sessionId: string) => void;
  renameSession: (sessionId: string, name: string) => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;
  clearChat: () => Promise<void>;
  askQuestion: (question: string, selectedText?: string, apiQuestion?: string) => Promise<void>;
  stopRequest: () => void;
  retryPreprocess: () => void;
}

export function usePdfChat(
  pdfId: string | undefined,
  accessToken: string | null,
  isActive: boolean,
): UsePdfChatReturn {
  const [preprocessRecord, setPreprocessRecord] = useState<PdfContentPreprocessResponse | null>(null);
  const [preprocessStatus, setPreprocessStatus] = useState<PreprocessStatus | null>(null);
  const [preprocessError, setPreprocessError] = useState<string | null>(null);

  const [sessions, setSessions] = useState<PdfChatSessionResponse[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  const [messagesBySession, setMessagesBySession] = useState<Record<string, ChatMessage[]>>({});
  const [streamingText, setStreamingText] = useState('');
  const [possibleQuestions, setPossibleQuestions] = useState<string[]>([]);
  const [isRequesting, setIsRequesting] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasInitiatedRef = useRef(false);
  const loadedSessionsRef = useRef<Set<string>>(new Set());
  // Tracks which session ID is currently streaming. Set to null when the stream
  // ends or the user switches away, so in-flight chunk events don't bleed into
  // a different session's view.
  const streamingSessionRef = useRef<string | null>(null);

  const activeSession = sessions.find((s) => s.id === activeSessionId) ?? null;
  const messages = activeSessionId ? (messagesBySession[activeSessionId] ?? []) : [];

  const setMessagesForSession = useCallback((sessionId: string, updater: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => {
    setMessagesBySession((prev) => {
      const current = prev[sessionId] ?? [];
      const next = typeof updater === 'function' ? updater(current) : updater;
      return { ...prev, [sessionId]: next };
    });
  }, []);

  const convertApiMessages = useCallback((apiMessages: PdfChatMessageResponse[]): ChatMessage[] => {
    return apiMessages.map((m) => ({
      role: m.who === 'USER' ? 'user' as const : 'assistant' as const,
      content: m.chat,
      selectedText: m.selected_text ?? undefined,
      citations: m.citations ?? undefined,
    }));
  }, []);

  const loadSessionMessages = useCallback(async (sessionId: string) => {
    if (loadedSessionsRef.current.has(sessionId)) return;
    try {
      const result = await getSessionChats(accessToken, sessionId, 100, 0);
      const reversed = [...result.messages].reverse();
      const converted = convertApiMessages(reversed);
      setMessagesForSession(sessionId, converted);
      loadedSessionsRef.current.add(sessionId);
    } catch {
      // silently fail — messages will load on retry or next switch
    }
  }, [accessToken, convertApiMessages, setMessagesForSession]);

  // --- Preprocessing ---

  const startPreprocessing = useCallback(async () => {
    if (!pdfId) return;
    setPreprocessError(null);
    try {
      const record = await preprocessPdf(accessToken, pdfId);
      setPreprocessRecord(record);
      setPreprocessStatus(record.status);
      if (record.status === 'FAILED') {
        setPreprocessError(record.error_message || 'Preprocessing failed');
      }
    } catch (err) {
      setPreprocessError((err as Error).message || 'Failed to start preprocessing');
    }
  }, [pdfId, accessToken]);

  const pollPreprocess = useCallback(async () => {
    if (!preprocessRecord) return;
    try {
      const updated = await getPreprocessStatus(accessToken, preprocessRecord.id);
      setPreprocessRecord(updated);
      setPreprocessStatus(updated.status);
      if (updated.status === 'FAILED') {
        setPreprocessError(updated.error_message || 'Preprocessing failed');
      }
    } catch (err) {
      setPreprocessError((err as Error).message || 'Failed to check status');
    }
  }, [preprocessRecord, accessToken]);

  useEffect(() => {
    if (!isActive || !pdfId) return;
    if (hasInitiatedRef.current) return;
    hasInitiatedRef.current = true;
    startPreprocessing();
  }, [isActive, pdfId, startPreprocessing]);

  useEffect(() => {
    if (pollTimerRef.current) {
      clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }

    if (!preprocessStatus || preprocessStatus === 'COMPLETED' || preprocessStatus === 'FAILED') {
      return;
    }

    const tick = () => {
      pollPreprocess();
      pollTimerRef.current = setTimeout(tick, POLL_INTERVAL);
    };
    pollTimerRef.current = setTimeout(tick, POLL_INTERVAL);

    return () => {
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    };
  }, [preprocessStatus, pollPreprocess]);

  // --- Load sessions once preprocessing completes ---

  const loadSessions = useCallback(async (preprocessId: string) => {
    try {
      const list = await listChatSessions(accessToken, preprocessId);
      setSessions(list);
      if (list.length > 0 && !activeSessionId) {
        const savedId = pdfId ? readLastSession(pdfId) : null;
        const target = (savedId && list.find((s) => s.id === savedId)) ? savedId : list[0].id;
        setActiveSessionId(target);
        loadSessionMessages(target);
      }
      if (list.length === 0) {
        const newSession = await createChatSession(accessToken, preprocessId);
        setSessions([newSession]);
        setActiveSessionId(newSession.id);
        if (pdfId) saveLastSession(pdfId, newSession.id);
      }
    } catch {
      // silently fail — user can retry
    }
  }, [accessToken, activeSessionId, pdfId, loadSessionMessages]);

  useEffect(() => {
    if (preprocessStatus === 'COMPLETED' && preprocessRecord) {
      loadSessions(preprocessRecord.id);
    }
  }, [preprocessStatus, preprocessRecord, loadSessions]);

  // --- Session CRUD ---

  const handleCreateSession = useCallback(async () => {
    if (!preprocessRecord) return;
    try {
      const newSession = await createChatSession(accessToken, preprocessRecord.id);
      setSessions((prev) => [newSession, ...prev]);
      setActiveSessionId(newSession.id);
      setPossibleQuestions([]);
      if (pdfId) saveLastSession(pdfId, newSession.id);
    } catch {
      // handled upstream
    }
  }, [accessToken, pdfId, preprocessRecord]);

  const handleSwitchSession = useCallback((sessionId: string) => {
    // If a stream was in progress for the current session, its data is now
    // incomplete (the complete event may never fire after the abort). Remove
    // it from the loaded-sessions cache so that when the user returns we make
    // a fresh API call and show whatever the backend persisted.
    if (isRequesting && activeSessionId) {
      loadedSessionsRef.current.delete(activeSessionId);
    }
    // Prevent in-flight chunk events for the old session from updating streamingText
    // after the switch (abort propagation is async).
    streamingSessionRef.current = null;
    setActiveSessionId(sessionId);
    setStreamingText('');
    setPossibleQuestions([]);
    setIsRequesting(false);
    abortRef.current?.abort();
    loadSessionMessages(sessionId);
    if (pdfId) saveLastSession(pdfId, sessionId);
  }, [pdfId, loadSessionMessages, isRequesting, activeSessionId]);

  const handleRenameSession = useCallback(async (sessionId: string, name: string) => {
    try {
      const updated = await renameChatSession(accessToken, sessionId, name);
      setSessions((prev) => prev.map((s) => (s.id === sessionId ? updated : s)));
    } catch {
      // handled upstream
    }
  }, [accessToken]);

  const handleDeleteSession = useCallback(async (sessionId: string) => {
    try {
      await deleteChatSession(accessToken, sessionId);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      setMessagesBySession((prev) => {
        const next = { ...prev };
        delete next[sessionId];
        return next;
      });
      loadedSessionsRef.current.delete(sessionId);

      if (activeSessionId === sessionId) {
        const remaining = sessions.filter((s) => s.id !== sessionId);
        if (remaining.length > 0) {
          setActiveSessionId(remaining[0].id);
          loadSessionMessages(remaining[0].id);
        } else if (preprocessRecord) {
          const newSession = await createChatSession(accessToken, preprocessRecord.id);
          setSessions([newSession]);
          setActiveSessionId(newSession.id);
        }
      }
    } catch {
      // handled upstream
    }
  }, [accessToken, activeSessionId, sessions, preprocessRecord, loadSessionMessages]);

  const handleClearChat = useCallback(async () => {
    if (!activeSessionId) return;
    try {
      await clearChatSessionMessages(accessToken, activeSessionId);
      setMessagesForSession(activeSessionId, []);
      setStreamingText('');
      setPossibleQuestions([]);
      loadedSessionsRef.current.delete(activeSessionId);
    } catch {
      // handled upstream
    }
  }, [accessToken, activeSessionId, setMessagesForSession]);

  // --- Ask question (SSE) ---

  const handleAskQuestion = useCallback(async (question: string, selectedText?: string, apiQuestion?: string) => {
    if (!activeSessionId || isRequesting) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    // Record which session this stream belongs to so we can guard UI-only state
    // updates (streamingText, isRequesting) against leaking into a different session
    // if the user switches away before the stream finishes.
    streamingSessionRef.current = activeSessionId;

    const shouldRename = activeSession?.name === 'Untitled';

    setMessagesForSession(activeSessionId, (prev) => [
      ...prev,
      { role: 'user', content: question, selectedText },
    ]);
    setIsRequesting(true);
    setStreamingText('');
    setPossibleQuestions([]);

    try {
      const generator = askPdf(accessToken, activeSessionId, apiQuestion ?? question, selectedText, controller.signal, shouldRename);

      for await (const event of generator) {
        if (event.type === 'session_rename') {
          setSessions((prev) =>
            prev.map((s) => s.id === activeSessionId ? { ...s, name: event.sessionName } : s),
          );
        } else if (event.type === 'chunk') {
          // Only update the shared streamingText when still viewing this session.
          if (streamingSessionRef.current === activeSessionId) {
            setStreamingText(event.accumulated);
          }
        } else if (event.type === 'complete') {
          // Always commit the answer to the originating session's message list.
          setMessagesForSession(activeSessionId, (prev) => [
            ...prev,
            { role: 'assistant', content: event.answer, citations: event.citations },
          ]);
          setPossibleQuestions(event.possibleQuestions);
          // Only clear the shared streaming UI state when still on this session.
          if (streamingSessionRef.current === activeSessionId) {
            setStreamingText('');
            setIsRequesting(false);
            streamingSessionRef.current = null;
          }
        } else if (event.type === 'error') {
          // Always commit the error message to the originating session.
          setMessagesForSession(activeSessionId, (prev) => [
            ...prev,
            { role: 'assistant', content: `Error: ${event.errorMessage}` },
          ]);
          if (streamingSessionRef.current === activeSessionId) {
            setStreamingText('');
            setIsRequesting(false);
            streamingSessionRef.current = null;
          }
        }
      }
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') return;
      setMessagesForSession(activeSessionId, (prev) => [
        ...prev,
        { role: 'assistant', content: `Error: ${(err as Error).message || 'Something went wrong'}` },
      ]);
      if (streamingSessionRef.current === activeSessionId) {
        setStreamingText('');
        setIsRequesting(false);
        streamingSessionRef.current = null;
      }
    }
  }, [activeSessionId, activeSession, isRequesting, accessToken, setMessagesForSession]);

  const handleStopRequest = useCallback(() => {
    streamingSessionRef.current = null;
    abortRef.current?.abort();
    setIsRequesting(false);
    if (streamingText) {
      setMessagesForSession(activeSessionId!, (prev) => [
        ...prev,
        { role: 'assistant', content: streamingText },
      ]);
      setStreamingText('');
    }
  }, [streamingText, activeSessionId, setMessagesForSession]);

  const retryPreprocess = useCallback(() => {
    hasInitiatedRef.current = false;
    setPreprocessRecord(null);
    setPreprocessStatus(null);
    setPreprocessError(null);
    startPreprocessing();
  }, [startPreprocessing]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    };
  }, []);

  const isPreprocessing = (!preprocessStatus && !preprocessError) || preprocessStatus === 'PENDING' || preprocessStatus === 'IN_PROGRESS';

  return {
    preprocessStatus,
    preprocessError,
    isPreprocessing,
    sessions,
    activeSession,
    messages,
    messagesBySession,
    streamingText,
    possibleQuestions,
    isRequesting,
    createSession: handleCreateSession,
    switchSession: handleSwitchSession,
    renameSession: handleRenameSession,
    deleteSession: handleDeleteSession,
    clearChat: handleClearChat,
    askQuestion: handleAskQuestion,
    stopRequest: handleStopRequest,
    retryPreprocess,
  };
}
