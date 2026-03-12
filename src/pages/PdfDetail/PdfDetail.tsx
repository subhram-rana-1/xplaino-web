import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import { Plus, ChevronLeft, ChevronRight, Eye, EyeOff, Share2, Download, MessageCircle } from 'lucide-react';
import styles from './PdfDetail.module.css';
import { useAuth } from '@/shared/hooks/useAuth';
import { getPdfById, getAllPdfs, sharePdf, makePdfPublic, makePdfPrivate, getPdfShareeList, unsharePdf, getDownloadUrl } from '@/shared/services/pdf.service';
import { getAllFolders } from '@/shared/services/folders.service';
import type { FolderWithSubFolders, ShareeItem } from '@/shared/types/folders.types';
import { getUserSettings, updateUserSettings } from '@/shared/services/user-settings.service';
import type { PdfResponse } from '@/shared/types/pdf.types';
import type { SettingsResponse } from '@/shared/types/user-settings.types';
import { Toast } from '@/shared/components/Toast';
import { PdfUploadModal } from '@/shared/components/PdfUploadModal';
import { LoginModal } from '@/shared/components/LoginModal';
import { PdfTranslateButton } from './PdfTranslateButton';
import { PdfTranslationOverlay } from './PdfTranslationOverlay';
import { usePdfTranslation } from './usePdfTranslation';
import { usePdfHighlights } from './usePdfHighlights';
import { usePdfNotes } from './usePdfNotes';
import { PdfSelectionTrigger } from './PdfSelectionTrigger';
import { PdfHighlightLayer } from './PdfHighlightLayer';
import { FolderSelectorPopover } from '@/shared/components/FolderSelectorPopover';
import { PdfSelectorPopover } from '@/shared/components/PdfSelectorPopover';
import { PdfShareModal } from '@/shared/components/PdfShareModal';
import { CopyPdfModal } from '@/shared/components/CopyPdfModal';
import { AskAISidePanel } from '@/shared/components/AskAISidePanel';
import { CreateCustomPromptModal } from '@/shared/components/CreateCustomPromptModal';
import { simplifyText, askAboutText } from '@/shared/services/simplify.service';
import type { ChatMessage } from '@/shared/services/simplify.service';
import { listCustomPrompts } from '@/shared/services/customPrompt.service';
import type { CustomPromptResponse } from '@/shared/types/customPrompt.types';
import { extractSurroundingContext, computeTextStartIndex } from './pdfTextContext';
import {
  createPdfTextChat,
  appendPdfTextChatMessages,
  getAllPdfTextChats,
  getPdfTextChatHistory,
  deletePdfTextChat,
} from '@/shared/services/pdfTextChat.service';
import type { ChatWho } from '@/shared/types/pdfTextChat.types';

// PDF.js worker: use same version as react-pdf's pdfjs-dist (5.4.296)
pdfjs.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@5.4.296/build/pdf.worker.min.mjs';

type ViewState = 'loading' | 'not_found' | 'no_file' | 'ready' | 'error';

const PDF_SIDEBAR_VISIBLE_KEY = 'xplaino-pdf-sidebar-visible';
const PDF_TOOLBAR_VISIBLE_KEY = 'xplaino-pdf-toolbar-visible';
const PDF_REFRESH_BANNER_DISMISSED_KEY = 'xplaino-pdf-refresh-banner-dismissed';
const PDF_FEATURE_DISCOVERY_SEEN_KEY = 'xplaino-pdf-feature-discovery-seen';

function getStoredPdfSidebarVisible(): boolean {
  try {
    const stored = localStorage.getItem(PDF_SIDEBAR_VISIBLE_KEY);
    return stored === null ? true : stored === 'true';
  } catch {
    return true;
  }
}

function getStoredToolbarVisible(): boolean {
  try {
    const stored = localStorage.getItem(PDF_TOOLBAR_VISIBLE_KEY);
    return stored === null ? true : stored === 'true';
  } catch {
    return true;
  }
}

function isRefreshBannerDismissed(): boolean {
  try {
    return localStorage.getItem(PDF_REFRESH_BANNER_DISMISSED_KEY) === 'true';
  } catch {
    return false;
  }
}

function isFeatureDiscoverySeen(): boolean {
  try {
    return localStorage.getItem(PDF_FEATURE_DISCOVERY_SEEN_KEY) === 'true';
  } catch {
    return false;
  }
}

/**
 * PdfDetail - PDF viewer page using react-pdf
 * Two-column layout: sticky sidebar (nav buttons + page thumbnails) + full-width PDF viewer.
 */
export const PdfDetail: React.FC = () => {
  const { pdfId } = useParams<{ pdfId: string }>();
  const [searchParams] = useSearchParams();
  const folderName = searchParams.get('folderName');
  const folderId = searchParams.get('folderId');
  const navigate = useNavigate();
  const { accessToken, isLoggedIn, isLoading: authLoading, user } = useAuth();
  const userFirstName = user?.firstName || user?.name?.split(' ')[0];

  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/.test(navigator.platform);

  const [sidebarVisible, setSidebarVisible] = useState(getStoredPdfSidebarVisible);
  const [toolbarVisible, setToolbarVisible] = useState(getStoredToolbarVisible);
  const [zoomLevel, setZoomLevel] = useState(1);
  const ZOOM_STEP = 0.25;
  const ZOOM_MIN = 0.5;
  const ZOOM_MAX = 2;
  // 0 = not showing, 1 = step 1 (toolbar spotlight), 2 = step 2 (highlight instruction)
  const [fdStep, setFdStep] = useState<0 | 1 | 2>(() => isFeatureDiscoverySeen() ? 0 : 1);
  const toolbarButtonsRef = useRef<HTMLDivElement>(null);
  const [spotlightRect, setSpotlightRect] = useState<{ top: number; left: number; width: number; height: number } | null>(null);

  // Resolved folder name: use query param if present, otherwise fetch from folders API
  const [resolvedFolderName, setResolvedFolderName] = useState<string | null>(folderName);

  // All folders for the folder selector popover
  const [allFolders, setAllFolders] = useState<FolderWithSubFolders[]>([]);

  useEffect(() => {
    if (!accessToken) return;
    getAllFolders(accessToken)
      .then((res) => setAllFolders(res.folders))
      .catch(() => {});
  }, [accessToken]);

  useEffect(() => {
    if (!accessToken) return;
    listCustomPrompts(0, 50)
      .then((res) => setUserCustomPrompts(res.prompts))
      .catch(() => {});
  }, [accessToken]);

  const handleFolderSelect = async (folder: FolderWithSubFolders) => {
    if (!accessToken) {
      navigate(`/user/dashboard/folder/${folder.id}/pdf`, { state: { folderName: folder.name } });
      return;
    }
    try {
      const result = await getAllPdfs(accessToken, folder.id);
      const pdfs = result.pdfs ?? [];
      if (pdfs.length > 0) {
        const sorted = [...pdfs].sort(
          (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        );
        const recent = sorted[0];
        const params = new URLSearchParams({
          folderId: folder.id,
          ...(folder.name ? { folderName: folder.name } : {}),
        });
        navigate(`/pdf/${recent.id}?${params}`);
      } else {
        navigate(`/user/dashboard/folder/${folder.id}/pdf`, { state: { folderName: folder.name } });
      }
    } catch {
      navigate(`/user/dashboard/folder/${folder.id}/pdf`, { state: { folderName: folder.name } });
    }
  };

  // Lock html/body/root to viewport height so only .mainArea scrolls internally
  useEffect(() => {
    const root = document.getElementById('root');
    document.documentElement.style.overflow = 'hidden';
    document.documentElement.style.height = '100%';
    document.body.style.overflow = 'hidden';
    document.body.style.height = '100%';
    if (root) {
      root.style.overflow = 'hidden';
      root.style.height = '100%';
    }
    return () => {
      document.documentElement.style.overflow = '';
      document.documentElement.style.height = '';
      document.body.style.overflow = '';
      document.body.style.height = '';
      if (root) {
        root.style.overflow = '';
        root.style.height = '';
      }
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(PDF_SIDEBAR_VISIBLE_KEY, String(sidebarVisible));
    } catch {
      // ignore
    }
  }, [sidebarVisible]);

  useEffect(() => {
    try {
      localStorage.setItem(PDF_TOOLBAR_VISIBLE_KEY, String(toolbarVisible));
    } catch {
      // ignore
    }
  }, [toolbarVisible]);

  // PDF data
  const [pdfDetails, setPdfDetails] = useState<PdfResponse | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [viewState, setViewState] = useState<ViewState>('loading');
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pdfDoc, setPdfDoc] = useState<any | null>(null);
  const [toast, setToast] = useState<{ message: string; type?: 'success' | 'error' } | null>(null);

  // Translation
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const [isTranslationActive, setIsTranslationActive] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const [userSettings, setUserSettings] = useState<SettingsResponse | null>(null);
  const mainAreaRef = useRef<HTMLDivElement>(null);

  // Container width for full-size pages
  const [containerWidth, setContainerWidth] = useState<number | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Per-page refs for scroll-to
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [activePage, setActivePage] = useState<number>(1);

  // Per-page render version counters so PdfHighlightLayer recomputes rects on re-render
  const [pageRenderVersions, setPageRenderVersions] = useState<Record<number, number>>({});

  // Pending note triggered from the text-selection trigger
  const [pendingNoteSelection, setPendingNoteSelection] = useState<{
    startText: string;
    endText: string;
    clientY: number;
  } | null>(null);

  // ── Text explanation (Explain feature) ────────────────────────────────────
  interface TextExplanation {
    id: string;
    textChatId: string | null;
    startText: string;
    endText: string;
    selectedText: string;
    surroundingContext: string;
    startPageNumber: number;
    endPageNumber: number;
    streamingText: string;
    chatMessages: ChatMessage[];
    isRequesting: boolean;
    firstChunkReceived: boolean;
    possibleQuestions: string[];
    abortController: AbortController | null;
  }

  const [explanations, setExplanations] = useState<TextExplanation[]>([]);
  const [activeExplanationId, setActiveExplanationId] = useState<string | null>(null);
  const [isExplainPanelOpen, setIsExplainPanelOpen] = useState(false);
  const [pulsingExplanationId, setPulsingExplanationId] = useState<string | null>(null);
  const [focusChatInput, setFocusChatInput] = useState(false);
  const explanationsRef = useRef<TextExplanation[]>([]);

  const [panelMode, setPanelMode] = useState<'text-explanation' | 'chat-with-pdf'>('text-explanation');
  const [chatWithPdfMessages, setChatWithPdfMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [chatWithPdfStreaming, setChatWithPdfStreaming] = useState('');
  const [isChatWithPdfRequesting, setIsChatWithPdfRequesting] = useState(false);
  const chatWithPdfAbortRef = useRef<AbortController | null>(null);

  const updateExplanation = useCallback((id: string, updater: (e: TextExplanation) => TextExplanation) => {
    setExplanations((prev) => {
      const next = prev.map((e) => e.id === id ? updater(e) : e);
      explanationsRef.current = next;
      return next;
    });
  }, []);

  const handleExplainFromSelection = useCallback(
    (startText: string, endText: string, selectedText: string, clientY: number) => {
      setActivePanelTitle('Text Explanation');
      const pageContainerEl = (() => {
        if (!contentRef.current) return null;
        const pages = contentRef.current.querySelectorAll('[data-page]');
        for (const page of pages) {
          const rect = page.getBoundingClientRect();
          if (clientY >= rect.top - 40 && clientY <= rect.bottom + 40) {
            return page as HTMLElement;
          }
        }
        return null;
      })();

      const pageNumber = pageContainerEl
        ? Number(pageContainerEl.getAttribute('data-page')) || 1
        : 1;

      const surroundingContext = extractSurroundingContext(
        selectedText, startText, endText, pageContainerEl,
      );
      const textStartIndex = computeTextStartIndex(startText, pageContainerEl);

      const id = `explain-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const abortController = new AbortController();

      const newExplanation: TextExplanation = {
        id,
        textChatId: null,
        startText,
        endText,
        selectedText,
        surroundingContext,
        startPageNumber: pageNumber,
        endPageNumber: pageNumber,
        streamingText: '',
        chatMessages: [],
        isRequesting: true,
        firstChunkReceived: false,
        possibleQuestions: [],
        abortController,
      };

      setExplanations((prev) => {
        const next = [...prev, newExplanation];
        explanationsRef.current = next;
        return next;
      });

      // Start SSE streaming
      (async () => {
        try {
          const generator = simplifyText(
            [{
              textStartIndex,
              textLength: selectedText.length,
              text: surroundingContext,
              previousSimplifiedTexts: [],
              languageCode: null,
            }],
            abortController.signal,
          );

          for await (const event of generator) {
            if (event.type === 'chunk') {
              const isFirst = !explanationsRef.current.find((e) => e.id === id)?.firstChunkReceived;
              updateExplanation(id, (e) => ({
                ...e,
                streamingText: event.accumulatedText,
                firstChunkReceived: true,
              }));
              if (isFirst) {
                setActiveExplanationId(id);
                setIsExplainPanelOpen(true);
                setPanelMode('text-explanation');
              }
            } else if (event.type === 'complete') {
              updateExplanation(id, (e) => ({
                ...e,
                streamingText: '',
                chatMessages: [
                  ...e.chatMessages,
                  { role: 'assistant', content: event.simplifiedText },
                ],
                isRequesting: false,
                possibleQuestions: event.possibleQuestions,
                abortController: null,
              }));
              if (!explanationsRef.current.find((e) => e.id === id)?.firstChunkReceived) {
                setActiveExplanationId(id);
                setIsExplainPanelOpen(true);
                setPanelMode('text-explanation');
              }
            } else if (event.type === 'error') {
              const hadChunk = explanationsRef.current.find((e) => e.id === id)?.firstChunkReceived;
              if (hadChunk) {
                updateExplanation(id, (e) => ({
                  ...e,
                  streamingText: '',
                  isRequesting: false,
                  abortController: null,
                }));
              } else {
                setExplanations((prev) => {
                  const next = prev.filter((e) => e.id !== id);
                  explanationsRef.current = next;
                  return next;
                });
              }
              setToast({ message: event.errorMessage || 'Failed to explain text', type: 'error' });
            }
          }
        } catch (err) {
          if ((err as Error)?.name === 'AbortError') {
            // Remove explanation if it never produced a first chunk (aborted during spinner)
            const hadChunk = explanationsRef.current.find((e) => e.id === id)?.firstChunkReceived;
            if (!hadChunk) {
              setExplanations((prev) => {
                const next = prev.filter((e) => e.id !== id);
                explanationsRef.current = next;
                return next;
              });
            }
            return;
          }
          const hadChunk = explanationsRef.current.find((e) => e.id === id)?.firstChunkReceived;
          if (hadChunk) {
            updateExplanation(id, (e) => ({
              ...e,
              streamingText: '',
              isRequesting: false,
              abortController: null,
            }));
          } else {
            setExplanations((prev) => {
              const next = prev.filter((e) => e.id !== id);
              explanationsRef.current = next;
              return next;
            });
          }
          setToast({ message: 'Failed to explain text', type: 'error' });
        }
      })();
    },
    [updateExplanation],
  );

  const handleAskAIFromSelection = useCallback(
    (startText: string, endText: string, selectedText: string, clientY: number) => {
      setActivePanelTitle('Text Explanation');
      const pageContainerEl = (() => {
        if (!contentRef.current) return null;
        const pages = contentRef.current.querySelectorAll('[data-page]');
        for (const page of pages) {
          const rect = page.getBoundingClientRect();
          if (clientY >= rect.top - 40 && clientY <= rect.bottom + 40) {
            return page as HTMLElement;
          }
        }
        return null;
      })();

      const pageNumber = pageContainerEl
        ? Number(pageContainerEl.getAttribute('data-page')) || 1
        : 1;

      const surroundingContext = extractSurroundingContext(
        selectedText, startText, endText, pageContainerEl,
      );

      const id = `explain-${Date.now()}-${Math.random().toString(36).slice(2)}`;

      const newExplanation: TextExplanation = {
        id,
        textChatId: null,
        startText,
        endText,
        selectedText,
        surroundingContext,
        startPageNumber: pageNumber,
        endPageNumber: pageNumber,
        streamingText: '',
        chatMessages: [],
        isRequesting: false,
        firstChunkReceived: true,
        possibleQuestions: [],
        abortController: null,
      };

      setExplanations((prev) => {
        const next = [...prev, newExplanation];
        explanationsRef.current = next;
        return next;
      });

      setActiveExplanationId(id);
      setIsExplainPanelOpen(true);
      setFocusChatInput(true);
      setPanelMode('text-explanation');
    },
    [],
  );

  const handlePromptFromSelection = useCallback(
    (startText: string, endText: string, selectedText: string, clientY: number, prompt: string) => {
      const pageContainerEl = (() => {
        if (!contentRef.current) return null;
        const pages = contentRef.current.querySelectorAll('[data-page]');
        for (const page of pages) {
          const rect = page.getBoundingClientRect();
          if (clientY >= rect.top - 40 && clientY <= rect.bottom + 40) {
            return page as HTMLElement;
          }
        }
        return null;
      })();

      const pageNumber = pageContainerEl
        ? Number(pageContainerEl.getAttribute('data-page')) || 1
        : 1;

      const surroundingContext = extractSurroundingContext(
        selectedText, startText, endText, pageContainerEl,
      );

      const id = `explain-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const abortController = new AbortController();

      const newExplanation: TextExplanation = {
        id,
        textChatId: null,
        startText,
        endText,
        selectedText,
        surroundingContext,
        startPageNumber: pageNumber,
        endPageNumber: pageNumber,
        streamingText: '',
        chatMessages: [],
        isRequesting: true,
        firstChunkReceived: true,
        possibleQuestions: [],
        abortController,
      };

      setExplanations((prev) => {
        const next = [...prev, newExplanation];
        explanationsRef.current = next;
        return next;
      });

      setActiveExplanationId(id);
      setIsExplainPanelOpen(true);
      setPanelMode('text-explanation');

      // Stream AI response immediately with the preset prompt
      (async () => {
        try {
          const generator = askAboutText(
            {
              question: prompt,
              chat_history: [],
              initial_context: surroundingContext,
              context_type: 'TEXT',
              languageCode: null,
            },
            abortController.signal,
          );

          updateExplanation(id, (e) => ({
            ...e,
            chatMessages: [...e.chatMessages, { role: 'user', content: prompt }],
          }));

          for await (const event of generator) {
            if (event.type === 'chunk') {
              updateExplanation(id, (e) => ({
                ...e,
                streamingText: event.accumulatedText,
              }));
            } else if (event.type === 'complete') {
              updateExplanation(id, (e) => ({
                ...e,
                streamingText: '',
                chatMessages: event.chatHistory,
                isRequesting: false,
                possibleQuestions: event.possibleQuestions,
                abortController: null,
              }));
            } else if (event.type === 'error') {
              updateExplanation(id, (e) => ({
                ...e,
                streamingText: '',
                isRequesting: false,
                abortController: null,
              }));
              setToast({ message: event.errorMessage || 'Failed to process prompt', type: 'error' });
            }
          }
        } catch (err) {
          if ((err as Error)?.name === 'AbortError') return;
          updateExplanation(id, (e) => ({
            ...e,
            streamingText: '',
            isRequesting: false,
            abortController: null,
          }));
          setToast({ message: 'Failed to process prompt', type: 'error' });
        }
      })();
    },
    [updateExplanation],
  );

  const handleCustomPromptFromSelection = useCallback(
    (title: string, startText: string, endText: string, selectedText: string, clientY: number, promptText: string) => {
      setActivePanelTitle(title);
      handlePromptFromSelection(startText, endText, selectedText, clientY, promptText);
    },
    [handlePromptFromSelection],
  );

  const handleChatWithPdfSubmit = useCallback(async (question: string) => {
    if (isChatWithPdfRequesting) return;

    chatWithPdfAbortRef.current?.abort();
    const abortController = new AbortController();
    chatWithPdfAbortRef.current = abortController;

    setChatWithPdfMessages((prev) => [...prev, { role: 'user', content: question }]);
    setIsChatWithPdfRequesting(true);
    setChatWithPdfStreaming('');

    try {
      const generator = askAboutText(
        {
          question,
          chat_history: chatWithPdfMessages.concat({ role: 'user', content: question }),
          initial_context: '',
          context_type: 'TEXT',
          languageCode: null,
        },
        abortController.signal,
      );

      for await (const event of generator) {
        if (event.type === 'chunk') {
          setChatWithPdfStreaming(event.accumulatedText);
        } else if (event.type === 'complete') {
          setChatWithPdfStreaming('');
          setChatWithPdfMessages(event.chatHistory);
          setIsChatWithPdfRequesting(false);
        } else if (event.type === 'error') {
          setChatWithPdfStreaming('');
          setIsChatWithPdfRequesting(false);
          setToast({ message: event.errorMessage || 'Failed to process request', type: 'error' });
        }
      }
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') return;
      setChatWithPdfStreaming('');
      setIsChatWithPdfRequesting(false);
      setToast({ message: 'Failed to process request', type: 'error' });
    }
  }, [isChatWithPdfRequesting, chatWithPdfMessages]);

  const handleChatWithPdfStop = useCallback(() => {
    chatWithPdfAbortRef.current?.abort();
    setIsChatWithPdfRequesting(false);
    setChatWithPdfStreaming('');
  }, []);

  const handleClearChatWithPdf = useCallback(() => {
    chatWithPdfAbortRef.current?.abort();
    setChatWithPdfMessages([]);
    setChatWithPdfStreaming('');
    setIsChatWithPdfRequesting(false);
  }, []);

  const handleAskFollowUp = useCallback(
    async (question: string) => {
      if (!activeExplanationId) return;
      const explanation = explanationsRef.current.find((e) => e.id === activeExplanationId);
      if (!explanation) return;

      const abortController = new AbortController();

      // Lazily recompute surroundingContext from the live PDF DOM if it was not
      // persisted (happens for chats reloaded from the backend after a page reload).
      let initialContext = explanation.surroundingContext;
      if (!initialContext) {
        const pageContainerEl = pageRefs.current[explanation.startPageNumber - 1] ?? null;
        const recomputed = extractSurroundingContext(
          explanation.startText,
          explanation.startText,
          explanation.endText,
          pageContainerEl,
        );
        initialContext = recomputed;
        // Cache it so subsequent follow-ups in the same session don't recompute.
        updateExplanation(activeExplanationId, (e) => ({ ...e, surroundingContext: recomputed }));
      }

      updateExplanation(activeExplanationId, (e) => ({
        ...e,
        chatMessages: [...e.chatMessages, { role: 'user', content: question }],
        streamingText: '',
        isRequesting: true,
        abortController,
      }));

      try {
        const generator = askAboutText(
          {
            question,
            chat_history: explanation.chatMessages,
            initial_context: initialContext,
            context_type: 'TEXT',
            languageCode: null,
          },
          abortController.signal,
        );

        for await (const event of generator) {
          if (event.type === 'chunk') {
            updateExplanation(activeExplanationId, (e) => ({
              ...e,
              streamingText: event.accumulatedText,
            }));
          } else if (event.type === 'complete') {
            updateExplanation(activeExplanationId, (e) => ({
              ...e,
              streamingText: '',
              chatMessages: event.chatHistory,
              isRequesting: false,
              possibleQuestions: event.possibleQuestions,
              abortController: null,
            }));

            const currentExplanation = explanationsRef.current.find((e) => e.id === activeExplanationId);
            if (currentExplanation?.textChatId && accessToken && pdfId) {
              const lastAssistant = [...event.chatHistory].reverse().find((m) => m.role === 'assistant');
              if (lastAssistant) {
                appendPdfTextChatMessages(accessToken, pdfId, currentExplanation.textChatId, {
                  chats: [
                    { who: 'USER', content: question },
                    { who: 'SYSTEM', content: lastAssistant.content },
                  ],
                }).catch((err) => console.error('Failed to append text chat messages:', err));
              }
            }
          } else if (event.type === 'error') {
            updateExplanation(activeExplanationId, (e) => ({
              ...e,
              streamingText: '',
              isRequesting: false,
              abortController: null,
            }));
            setToast({ message: event.errorMessage || 'Failed to get answer', type: 'error' });
          }
        }
      } catch (err) {
        if ((err as Error)?.name === 'AbortError') return;
        updateExplanation(activeExplanationId, (e) => ({
          ...e,
          streamingText: '',
          isRequesting: false,
          abortController: null,
        }));
        setToast({ message: 'Failed to get answer', type: 'error' });
      }
    },
    [activeExplanationId, updateExplanation, accessToken, pdfId],
  );

  const handleStopExplainRequest = useCallback(() => {
    if (!activeExplanationId) return;
    const explanation = explanationsRef.current.find((e) => e.id === activeExplanationId);
    explanation?.abortController?.abort();
    updateExplanation(activeExplanationId, (e) => ({
      ...e,
      isRequesting: false,
      abortController: null,
    }));
  }, [activeExplanationId, updateExplanation]);

  const handleCloseExplainPanel = useCallback(() => {
    setIsExplainPanelOpen(false);
  }, []);

  const handleClearExplainChat = useCallback(() => {
    if (!activeExplanationId) return;

    const explanation = explanationsRef.current.find((e) => e.id === activeExplanationId);
    if (explanation?.textChatId && accessToken && pdfId) {
      deletePdfTextChat(accessToken, pdfId, explanation.textChatId)
        .catch((err) => console.error('Failed to delete text chat:', err));
    }

    setExplanations((prev) => {
      const next = prev.filter((e) => e.id !== activeExplanationId);
      explanationsRef.current = next;
      return next;
    });
    setActiveExplanationId(null);
    setIsExplainPanelOpen(false);
  }, [activeExplanationId, accessToken, pdfId]);

  const handleExplanationIconClick = useCallback((id: string) => {
    setActiveExplanationId(id);
    setIsExplainPanelOpen(true);
  }, []);

  const handleScrollToExplanationText = useCallback(() => {
    if (!activeExplanationId) return;
    const explanation = explanationsRef.current.find((e) => e.id === activeExplanationId);
    if (!explanation) return;

    const pageIndex = explanation.startPageNumber - 1;
    const el = pageRefs.current[pageIndex];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => {
        setPulsingExplanationId(activeExplanationId);
      }, 500);
    }
  }, [activeExplanationId]);

  const handlePulseComplete = useCallback(() => {
    setPulsingExplanationId(null);
  }, []);

  const handleDeleteExplainChat = useCallback(async () => {
    if (!activeExplanationId || !accessToken || !pdfId) return;
    const explanation = explanationsRef.current.find((e) => e.id === activeExplanationId);
    if (!explanation?.textChatId) return;
    try {
      await deletePdfTextChat(accessToken, pdfId, explanation.textChatId);
      updateExplanation(activeExplanationId, (e) => ({ ...e, textChatId: null }));
      setToast({ message: 'Chat deleted', type: 'success' });
    } catch (err) {
      console.error('Failed to delete text chat:', err);
      setToast({ message: 'Failed to delete chat', type: 'error' });
    }
  }, [activeExplanationId, accessToken, pdfId, updateExplanation]);

  const handleSaveExplainChat = useCallback(async () => {
    if (!activeExplanationId || !accessToken || !pdfId) return;
    const explanation = explanationsRef.current.find((e) => e.id === activeExplanationId);
    if (!explanation || explanation.textChatId) return;

    const truncate = (s: string, max: number) => s.slice(0, max);

    try {
      const chats = explanation.chatMessages.map((m) => ({
        who: (m.role === 'user' ? 'USER' : 'SYSTEM') as ChatWho,
        content: m.content,
      }));

      const result = await createPdfTextChat(accessToken, pdfId, {
        start_text_pdf_page_number: explanation.startPageNumber,
        end_text_pdf_page_number: explanation.endPageNumber,
        start_text: truncate(explanation.startText, 50),
        end_text: truncate(explanation.endText, 50),
        chats: chats.length > 0 ? chats : undefined,
      });

      updateExplanation(activeExplanationId, (e) => ({
        ...e,
        textChatId: result.chat.id,
      }));

      setToast({ message: 'Chat saved', type: 'success' });
    } catch (err) {
      console.error('Failed to save text chat:', err);
      setToast({ message: 'Failed to save chat', type: 'error' });
    }
  }, [activeExplanationId, accessToken, pdfId, updateExplanation]);

  const activeExplanation = explanations.find((e) => e.id === activeExplanationId) ?? null;

  const handleWriteNoteFromSelection = useCallback(
    (startText: string, endText: string, clientY: number) => {
      setPendingNoteSelection({ startText, endText, clientY });
      // Reset after a tick so PdfHighlightLayer treats each click as a fresh trigger
      setTimeout(() => setPendingNoteSelection(null), 100);
    },
    [],
  );

  // Derived viewer-role booleans (declared early so hooks below can consume them)
  const isOwner = !!user && pdfDetails !== null && user.id === pdfDetails.created_by;
  const isPublic = pdfDetails?.access_level === 'PUBLIC';
  // Can annotate: owner, or any logged-in user on a private PDF (must be sharee — backend enforces access)
  const canEditAnnotations = isOwner || (isLoggedIn && !isPublic);

  // Highlights
  const {
    colours: highlightColours,
    selectedColourId,
    setSelectedColourId,
    highlights,
    createHighlight,
    deleteHighlight,
  } = usePdfHighlights({ pdfId, accessToken: accessToken ?? null, isPublic });

  const handleHighlightFromPanel = useCallback(() => {
    if (!activeExplanation) return;
    createHighlight(activeExplanation.startText, activeExplanation.endText);
  }, [activeExplanation, createHighlight]);

  const [pendingNoteExplanationId, setPendingNoteExplanationId] = useState<string | null>(null);

  const handleAddNoteFromPanel = useCallback(() => {
    if (!activeExplanationId) return;
    setPendingNoteExplanationId(activeExplanationId);
    setTimeout(() => setPendingNoteExplanationId(null), 100);
  }, [activeExplanationId]);

  // Notes
  const { notes: pdfNotes, createNote, updateNote, deleteNote } = usePdfNotes({ pdfId, accessToken: accessToken ?? null, isPublic });

  // Translation hook
  const { pageTranslations, resetTranslation } = usePdfTranslation({
    pdfDoc: isTranslationActive ? pdfDoc : null,
    numPages,
    targetLanguage: isTranslationActive ? selectedLanguage : null,
    accessToken: accessToken ?? null,
    scrollContainerRef: mainAreaRef,
  });

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isLoginModalClosing, setIsLoginModalClosing] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [pdfShareeList, setPdfShareeList] = useState<ShareeItem[]>([]);
  const [isPdfShareeListLoading, setIsPdfShareeListLoading] = useState(false);
  const [showCreatePromptModal, setShowCreatePromptModal] = useState(false);
  const [userCustomPrompts, setUserCustomPrompts] = useState<CustomPromptResponse[]>([]);
  const [activePanelTitle, setActivePanelTitle] = useState('Text Explanation');

  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = useCallback(async () => {
    if (!pdfDetails || isDownloading) return;
    const fileUpload = pdfDetails.file_uploads?.[0];
    if (!fileUpload) return;
    setIsDownloading(true);
    try {
      let url: string;
      if (accessToken) {
        const res = await getDownloadUrl(accessToken, fileUpload.id);
        url = res.download_url;
      } else {
        url = fileUpload.s3_url ?? '';
      }
      if (!url) throw new Error('No download URL available');
      const response = await fetch(url);
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = pdfDetails.file_name;
      a.click();
      URL.revokeObjectURL(objectUrl);
    } catch {
      setToast({ message: 'Failed to download PDF', type: 'error' });
    } finally {
      setIsDownloading(false);
    }
  }, [pdfDetails, accessToken, isDownloading]);

  const handleSharePdfSubmit = useCallback(async (email: string) => {
    if (!accessToken || !pdfId) return;
    await sharePdf(accessToken, pdfId, email);
  }, [accessToken, pdfId]);

  const handleMakePdfPublic = useCallback(async () => {
    if (!accessToken || !pdfId) throw new Error('Not authenticated');
    const updated = await makePdfPublic(accessToken, pdfId);
    setPdfDetails(updated);
    return updated;
  }, [accessToken, pdfId]);

  const handleMakePdfPrivate = useCallback(async () => {
    if (!accessToken || !pdfId) throw new Error('Not authenticated');
    const updated = await makePdfPrivate(accessToken, pdfId);
    setPdfDetails(updated);
    return updated;
  }, [accessToken, pdfId]);

  const handleFetchSharees = useCallback(async () => {
    if (!accessToken || !pdfId) return;
    setIsPdfShareeListLoading(true);
    try {
      const res = await getPdfShareeList(accessToken, pdfId);
      setPdfShareeList(res.sharees);
    } catch {
      setPdfShareeList([]);
    } finally {
      setIsPdfShareeListLoading(false);
    }
  }, [accessToken, pdfId]);

  const handleUnsharePdf = useCallback(async (email: string) => {
    if (!accessToken || !pdfId) return;
    await unsharePdf(accessToken, pdfId, email);
    setPdfShareeList(prev => prev.filter(s => s.email !== email));
  }, [accessToken, pdfId]);

  const handleFdNext = useCallback(() => setFdStep(2), []);

  const handleFeatureDiscoveryDismiss = useCallback(() => {
    try { localStorage.setItem(PDF_FEATURE_DISCOVERY_SEEN_KEY, 'true'); } catch {}
    setFdStep(0);
  }, []);

  // Cmd+B (Mac) / Ctrl+B (others) toggles the Chat with PDF panel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const modifierHeld = isMac ? e.metaKey : e.ctrlKey;
      if (modifierHeld && e.key === 'b') {
        e.preventDefault();
        setPanelMode('chat-with-pdf');
        setIsExplainPanelOpen((open) => !open);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMac]);

  // Compute spotlight bounding rect for step 1 once the toolbar buttons are in the DOM.
  // Uses multiple strategies to catch the coupon banner appearing asynchronously:
  //  1. Immediate compute
  //  2. Window resize listener
  //  3. MutationObserver on #root to detect DOM insertions (e.g. coupon banner)
  //  4. Staggered timeouts as a safety net
  useEffect(() => {
    if (fdStep !== 1) return;
    const compute = () => {
      if (!toolbarButtonsRef.current) return;
      const rect = toolbarButtonsRef.current.getBoundingClientRect();
      const padding = 16;
      setSpotlightRect({
        top: rect.top - padding,
        left: rect.left - padding,
        width: rect.width + padding * 2,
        height: rect.height + padding * 2,
      });
    };
    compute();

    const t1 = setTimeout(compute, 300);
    const t2 = setTimeout(compute, 800);
    const t3 = setTimeout(compute, 1500);

    window.addEventListener('resize', compute);

    // MutationObserver on #root catches any DOM insertion (coupon banner, nav changes, etc.)
    const rootEl = document.getElementById('root');
    const mo = new MutationObserver(compute);
    if (rootEl) mo.observe(rootEl, { childList: true, subtree: true });

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      window.removeEventListener('resize', compute);
      mo.disconnect();
    };
  }, [fdStep, viewState]);



  // Refresh banner: show when browser zoom increases beyond the level at page load
  const [showRefreshBanner, setShowRefreshBanner] = useState(false);
  const initialPixelRatioRef = useRef<number>(window.devicePixelRatio);

  useEffect(() => {
    if (isRefreshBannerDismissed()) return;

    const checkResize = () => {
      if (isRefreshBannerDismissed()) return;
      if (window.devicePixelRatio > initialPixelRatioRef.current) {
        setShowRefreshBanner(true);
      } else {
        setShowRefreshBanner(false);
      }
    };

    window.addEventListener('resize', checkResize);
    return () => window.removeEventListener('resize', checkResize);
  }, []);

  const handleRefreshBannerRefresh = useCallback(() => {
    window.location.reload();
  }, []);

  const handleRefreshBannerGotIt = useCallback(() => {
    try {
      localStorage.setItem(PDF_REFRESH_BANNER_DISMISSED_KEY, 'true');
    } catch {
      // ignore
    }
    setShowRefreshBanner(false);
  }, []);

  // Observe content area width for full-size page rendering.
  // Depends on viewState so the effect re-runs once the .content div is in the DOM (viewState === 'ready').
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const observer = new ResizeObserver(entries => {
      const width = entries[0]?.contentRect.width;
      if (width) setContainerWidth(Math.min(width, 800));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [viewState]);

  // Load PDF data and user settings
  useEffect(() => {
    if (authLoading || !pdfId) return;

    let cancelled = false;

    const loadPdf = async () => {
      try {
        setViewState('loading');

        const token = isLoggedIn ? (accessToken ?? null) : null;
        const [pdf] = await Promise.all([
          getPdfById(pdfId, token),
          // Load user settings in parallel to pre-populate language & highlight colour
          (isLoggedIn && accessToken
            ? getUserSettings(accessToken).then(res => {
                if (cancelled) return;
                setUserSettings(res.settings);
                if (res.settings.nativeLanguage) {
                  setSelectedLanguage(res.settings.nativeLanguage);
                }
                if (res.settings.highlighter?.id) {
                  setSelectedColourId(res.settings.highlighter.id);
                }
              })
            : Promise.resolve()),
        ]);

        if (cancelled) return;

        setPdfDetails(pdf);

        const fileUploads = pdf.file_uploads ?? [];
        if (fileUploads.length === 0) {
          setViewState('no_file');
          return;
        }

        const s3Url = fileUploads[0].s3_url;
        if (!s3Url) {
          setViewState('no_file');
          return;
        }

        setDownloadUrl(s3Url);
        setViewState('ready');
      } catch (error) {
        if (cancelled) return;
        console.error('Error loading PDF:', error);
        const message = error instanceof Error ? error.message : 'Failed to load PDF';
        setToast({ message, type: 'error' });
        setViewState('error');
      }
    };

    loadPdf();
    return () => {
      cancelled = true;
    };
  }, [authLoading, isLoggedIn, accessToken, pdfId]);

  // Load saved text chat conversations from the backend
  useEffect(() => {
    if (!pdfId || (!accessToken && !isPublic) || viewState !== 'ready') return;

    let cancelled = false;

    const roleFromWho = (who: ChatWho): 'user' | 'assistant' =>
      who === 'USER' ? 'user' : 'assistant';

    (async () => {
      try {
        const { chats } = await getAllPdfTextChats(accessToken ?? null, pdfId);
        if (cancelled || chats.length === 0) return;

        const hydrated: TextExplanation[] = await Promise.all(
          chats.map(async (chat) => {
            const historyRes = await getPdfTextChatHistory(accessToken ?? null, pdfId, chat.id, 0, 200);
            const messages: ChatMessage[] = historyRes.messages
              .slice()
              .reverse()
              .map((m) => ({ role: roleFromWho(m.who), content: m.content }));

            return {
              id: chat.id,
              textChatId: chat.id,
              startText: chat.start_text,
              endText: chat.end_text,
              selectedText: '',
              surroundingContext: '',
              startPageNumber: chat.start_text_pdf_page_number,
              endPageNumber: chat.end_text_pdf_page_number,
              streamingText: '',
              chatMessages: messages,
              isRequesting: false,
              firstChunkReceived: true,
              possibleQuestions: [],
              abortController: null,
            };
          }),
        );

        if (cancelled) return;

        setExplanations((prev) => {
          const existingIds = new Set(prev.map((e) => e.textChatId).filter(Boolean));
          const newOnes = hydrated.filter((h) => !existingIds.has(h.textChatId));
          if (newOnes.length === 0) return prev;
          const next = [...prev, ...newOnes];
          explanationsRef.current = next;
          return next;
        });
      } catch (err) {
        console.error('Failed to load saved text chats:', err);
      }
    })();

    return () => { cancelled = true; };
  }, [pdfId, accessToken, isPublic, viewState]);

  // Resolve folder name from API when only folderId is available (no folderName query param)
  useEffect(() => {
    const effectiveFolderId = folderId || pdfDetails?.folder_id;
    if (folderName || !effectiveFolderId || !accessToken) return;

    const findInTree = (folders: FolderWithSubFolders[], id: string): string | null => {
      for (const f of folders) {
        if (f.id === id) return f.name;
        const found = findInTree(f.subFolders || [], id);
        if (found) return found;
      }
      return null;
    };

    getAllFolders(accessToken)
      .then((res) => {
        const name = findInTree(res.folders, effectiveFolderId);
        if (name) setResolvedFolderName(name);
      })
      .catch(() => {});
  }, [folderId, folderName, pdfDetails?.folder_id, accessToken]);

  const onDocumentLoadSuccess = (pdf: any) => {
    setNumPages(pdf.numPages);
    setPdfDoc(pdf);
    pageRefs.current = new Array(pdf.numPages).fill(null);
  };

  const onDocumentLoadError = (error: Error) => {
    console.error('Document load error:', error);
    setToast({ message: error.message || 'Failed to load PDF document', type: 'error' });
    setViewState('error');
  };

  const scrollToPage = useCallback((pageNum: number) => {
    setActivePage(pageNum);
    const el = pageRefs.current[pageNum - 1];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  const handleNewPdf = () => {
    setIsUploadModalOpen(true);
  };

  const handleTranslate = useCallback(() => {
    if (!selectedLanguage) return;
    resetTranslation();
    setIsTranslationActive(true);
    setShowOriginal(false);
  }, [selectedLanguage, resetTranslation]);

  const handleLanguageChange = useCallback(async (code: string | null) => {
    setSelectedLanguage(code);
    if (isTranslationActive) {
      resetTranslation();
      setIsTranslationActive(false);
    }
    // Persist language to user settings, preserving other fields
    if (accessToken && userSettings) {
      try {
        const updated = await updateUserSettings(accessToken, {
          nativeLanguage: (code as import('@/shared/types/user-settings.types').NativeLanguage | null),
          pageTranslationView: userSettings.pageTranslationView,
          theme: userSettings.theme,
          highlighter: userSettings.highlighter ?? null,
        });
        setUserSettings(updated);
      } catch {
        // Non-critical – settings persist locally even if PATCH fails
      }
    }
  }, [isTranslationActive, resetTranslation, accessToken, userSettings]);

  const handleHighlightColourChange = useCallback(async (id: string) => {
    setSelectedColourId(id);
    if (accessToken && userSettings) {
      const colour = highlightColours.find((c) => c.id === id);
      try {
        const updated = await updateUserSettings(accessToken, {
          nativeLanguage: (selectedLanguage as import('@/shared/types/user-settings.types').NativeLanguage | null),
          pageTranslationView: userSettings.pageTranslationView,
          theme: userSettings.theme,
          highlighter: colour ? { id: colour.id, hexcode: colour.hexcode } : (userSettings.highlighter ?? null),
        });
        setUserSettings(updated);
      } catch {
        // Non-critical — colour already applied locally
      }
    }
  }, [accessToken, userSettings, highlightColours, selectedLanguage, setSelectedColourId]);



  // Sidebar toggle button (same as UserDashboard bookmark sidebar)
  const sidebarToggle = (
    <button
      type="button"
      className={`${styles.sidebarToggle} ${!sidebarVisible ? styles.sidebarToggleCollapsed : ''}`}
      onClick={() => setSidebarVisible((v) => !v)}
      title={sidebarVisible ? 'Hide sidebar' : 'Show sidebar'}
      aria-label={sidebarVisible ? 'Hide sidebar' : 'Show sidebar'}
    >
      {sidebarVisible ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
    </button>
  );

  // Sidebar JSX (shared across states)
  const sidebar = (
    <aside className={`${styles.sidebar} ${!sidebarVisible ? styles.sidebarHidden : ''}`}>
      <div className={styles.sidebarButtons}>
        {isLoggedIn && (
          <>
            <button
              className={styles.pdfBreadcrumbBack}
              onClick={() => navigate('/user/dashboard')}
            >
              ← Dashboard
            </button>
            <div className={styles.sidebarDropdowns}>
              <FolderSelectorPopover
                folders={allFolders}
                currentFolderId={folderId || pdfDetails?.folder_id || undefined}
                onSelect={handleFolderSelect}
              />
              <PdfSelectorPopover
                folderId={folderId || pdfDetails?.folder_id || undefined}
                currentPdfId={pdfId}
                currentPdfName={pdfDetails?.file_name}
                accessToken={accessToken}
                onSelect={(pdf) => {
                  const effectiveFolderId = folderId || pdfDetails?.folder_id;
                  const params = new URLSearchParams({
                    ...(effectiveFolderId ? { folderId: effectiveFolderId } : {}),
                    ...(resolvedFolderName ? { folderName: resolvedFolderName } : {}),
                  });
                  navigate(`/pdf/${pdf.id}${params.toString() ? `?${params}` : ''}`);
                }}
              />
            </div>
          </>
        )}
        <button className={styles.sidebarBtn} onClick={handleNewPdf} title="New PDF">
          <Plus size={15} />
          <span>New PDF</span>
        </button>
      </div>

      {numPages !== null && (
        <div className={styles.sidebarPageCount}>
          {numPages} {numPages === 1 ? 'page' : 'pages'}
        </div>
      )}

      {downloadUrl && numPages !== null && (
        <div className={styles.thumbnailList}>
            <Document
              file={downloadUrl}
              loading={null}
              className={styles.thumbnailDocument}
            >
              {Array.from(new Array(numPages), (_, index) => (
                <button
                  key={`thumb-${index + 1}`}
                  className={`${styles.thumbnailBtn} ${activePage === index + 1 ? styles.thumbnailActive : ''}`}
                  onClick={() => scrollToPage(index + 1)}
                  title={`Page ${index + 1}`}
                >
                  <Page
                    pageNumber={index + 1}
                    width={130}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                    className={styles.thumbnailPage}
                  />
                  <span className={styles.thumbnailLabel}>{index + 1}</span>
                </button>
              ))}
            </Document>
          </div>
        )}
    </aside>
  );

  const refreshBanner = showRefreshBanner && (
    <div className={styles.refreshBanner} role="status" aria-live="polite">
      <span className={styles.refreshBannerMessage}>Refresh the page for content clarity</span>
      <div className={styles.refreshBannerActions}>
        <button type="button" className={styles.refreshBannerBtn} onClick={handleRefreshBannerRefresh}>
          Refresh
        </button>
        <button type="button" className={styles.refreshBannerBtnSecondary} onClick={handleRefreshBannerGotIt}>
          Got it
        </button>
      </div>
    </div>
  );

  if (viewState === 'loading') {
    return (
      <div className={styles.wrapper}>
        {refreshBanner}
        {sidebar}
        {sidebarToggle}
        <div className={styles.mainArea}>
          <div className={styles.loading}>Loading PDF...</div>
        </div>
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </div>
    );
  }

  if (viewState === 'not_found') {
    return (
      <div className={styles.wrapper}>
        {refreshBanner}
        {sidebar}
        {sidebarToggle}
        <div className={styles.mainArea}>
          <div className={styles.emptyState}>
            <h2 className={styles.emptyHeading}>PDF not found</h2>
            <p className={styles.emptyMessage}>This PDF does not exist or you do not have access to it.</p>
          </div>
        </div>
      </div>
    );
  }

  if (viewState === 'no_file') {
    return (
      <div className={styles.wrapper}>
        {refreshBanner}
        {sidebar}
        {sidebarToggle}
        <div className={styles.mainArea}>
          <div className={styles.emptyState}>
            <h2 className={styles.emptyHeading}>No file attached</h2>
            <p className={styles.emptyMessage}>This PDF has no file attached yet.</p>
          </div>
        </div>
      </div>
    );
  }

  if (viewState === 'error') {
    return (
      <div className={styles.wrapper}>
        {refreshBanner}
        {sidebar}
        {sidebarToggle}
        <div className={styles.mainArea}>
          <div className={styles.emptyState}>
            <h2 className={styles.emptyHeading}>Failed to load PDF</h2>
            <p className={styles.emptyMessage}>Something went wrong. Please try again.</p>
          </div>
        </div>
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      {refreshBanner}
      {sidebar}
      {sidebarToggle}

      <div className={styles.mainArea} ref={mainAreaRef}>

        <div className={styles.toolbar}>
          {/* Entire toolbar row — collapses as one unit */}
          <div className={`${styles.toolbarRow} ${!toolbarVisible ? styles.toolbarRowHidden : ''}`}>
            <div className={styles.toolbarSpacer} />
            <div className={styles.toolbarButtons} ref={toolbarButtonsRef}>
              {/* <PdfTranslateButton
                selectedLanguage={selectedLanguage}
                onLanguageChange={handleLanguageChange}
                onTranslate={handleTranslate}
                isTranslating={
                  isTranslationActive &&
                  Object.values(pageTranslations).some((s) => s.status === 'translating')
                }
                isTranslated={
                  isTranslationActive &&
                  numPages !== null &&
                  numPages > 0 &&
                  Object.values(pageTranslations).some((s) => s.status === 'translated') &&
                  !Object.values(pageTranslations).some((s) => s.status === 'translating')
                }
              /> */}
              <button
                type="button"
                className={styles.chatWithPdfBtn}
                onClick={() => {
                  if (isExplainPanelOpen && panelMode === 'chat-with-pdf') {
                    handleCloseExplainPanel();
                  } else {
                    setPanelMode('chat-with-pdf');
                    setIsExplainPanelOpen(true);
                  }
                }}
                title="Chat with PDF"
              >
                <ChatIcon />
                <span>Chat with PDF</span>
                <kbd className={styles.chatWithPdfKbd}>{isMac ? '⌘B' : 'Ctrl+B'}</kbd>
              </button>
              {isTranslationActive && Object.values(pageTranslations).some((s) => s.status === 'translated') && (
                <button
                  type="button"
                  className={styles.toggleViewBtn}
                  onClick={() => setShowOriginal((v) => !v)}
                  title={showOriginal ? 'Show translated' : 'Show original'}
                >
                  {showOriginal ? 'Translated' : 'Original'}
                </button>
              )}
            </div>
            <div className={styles.toolbarEndActions}>
              <div className={styles.zoomControls}>
                <button
                  type="button"
                  className={styles.zoomBtn}
                  onClick={() => setZoomLevel(z => Math.max(ZOOM_MIN, parseFloat((z - ZOOM_STEP).toFixed(2))))}
                  disabled={zoomLevel <= ZOOM_MIN}
                  aria-label="Zoom out"
                >
                  −
                </button>
                <span className={styles.zoomLevel}>{Math.round(zoomLevel * 100)}%</span>
                <button
                  type="button"
                  className={styles.zoomBtn}
                  onClick={() => setZoomLevel(z => Math.min(ZOOM_MAX, parseFloat((z + ZOOM_STEP).toFixed(2))))}
                  disabled={zoomLevel >= ZOOM_MAX}
                  aria-label="Zoom in"
                >
                  +
                </button>
              </div>
              <div className={styles.iconBtnWrapper}>
                <button
                  type="button"
                  className={styles.iconBtn}
                  onClick={() => setToolbarVisible(false)}
                  aria-label="Hide toolbar"
                >
                  <EyeOff size={14} />
                </button>
                <span className={styles.iconBtnTooltip}>Hide toolbar</span>
              </div>
              <div className={styles.iconBtnWrapper}>
                <button
                  type="button"
                  className={styles.iconBtn}
                  onClick={handleDownload}
                  disabled={isDownloading}
                  aria-label="Download PDF"
                >
                  <Download size={16} />
                </button>
                <span className={styles.iconBtnTooltip}>Download</span>
              </div>
              <div className={styles.iconBtnWrapper}>
                <button
                  type="button"
                  className={styles.iconBtn}
                  onClick={() => setShowShareModal(true)}
                  aria-label="Share PDF"
                >
                  <Share2 size={16} />
                </button>
                <span className={styles.iconBtnTooltip}>Share</span>
              </div>
            </div>
          </div>

        </div>

        {/* Show-toolbar button — sticks at top-right of scroll area */}
        {!toolbarVisible && (
          <div className={styles.toolbarRevealFixed}>
            <div className={styles.iconBtnWrapper}>
              <button
                type="button"
                className={styles.iconBtn}
                onClick={() => setToolbarVisible(true)}
                aria-label="Show toolbar"
              >
                <Eye size={14} />
              </button>
              <span className={`${styles.iconBtnTooltip} ${styles.iconBtnTooltipLeft}`}>Show toolbar</span>
            </div>
          </div>
        )}

        {pdfDetails && (
          <h2 className={styles.pdfFileHeading}>
            {pdfDetails.file_name.replace(/\.pdf$/i, '')}
          </h2>
        )}

        <div className={styles.content} ref={contentRef}>
          {(canEditAnnotations || isPublic) && (
            <PdfSelectionTrigger
              containerRef={contentRef}
              activeColour={
                highlightColours.find((c) => c.id === selectedColourId)?.hexcode ?? '#fbbf24'
              }
              highlightColours={highlightColours}
              selectedColourId={selectedColourId}
              onColourChange={handleHighlightColourChange}
              onHighlight={createHighlight}
              onError={(msg) => setToast({ message: msg, type: 'error' })}
              isLoggedIn={isLoggedIn}
              onLoginRequired={() => setShowLoginModal(true)}
              onWriteNote={handleWriteNoteFromSelection}
              onExplain={handleExplainFromSelection}
              onAskAI={handleAskAIFromSelection}
              onPromptSelect={handlePromptFromSelection}
              onCopyRequired={!canEditAnnotations ? () => setShowCopyModal(true) : undefined}
              onAddCustomPrompt={() => setShowCreatePromptModal(true)}
              customPrompts={userCustomPrompts}
              onCustomPromptSelect={handleCustomPromptFromSelection}
            />
          )}
          {downloadUrl && (
            <Document
              file={downloadUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading={<div className={styles.loading}>Loading document…</div>}
              className={styles.document}
            >
              {numPages !== null &&
                Array.from(new Array(numPages), (_, index) => {
                  const pageNumber = index + 1;
                  const pageState = pageTranslations[pageNumber];
                  const isPageTranslated = pageState?.status === 'translated';
                  const translatedParagraphs =
                    isPageTranslated && pageState.status === 'translated'
                      ? pageState.paragraphs
                      : null;

                  const pageHighlights = highlights.filter(
                    (h) => h.startText || h.endText,
                  );

                  return (
                    <div
                      key={`page-${pageNumber}`}
                      ref={el => { pageRefs.current[index] = el; }}
                      className={styles.pageWrapper}
                      data-page={pageNumber}
                    >
                      <Page
                        pageNumber={pageNumber}
                        renderTextLayer={!isPageTranslated || showOriginal}
                        renderAnnotationLayer={true}
                        className={styles.page}
                        width={containerWidth ? Math.round(containerWidth * zoomLevel) : undefined}
                        onRenderSuccess={() => {
                          setPageRenderVersions((prev) => ({
                            ...prev,
                            [pageNumber]: (prev[pageNumber] ?? 0) + 1,
                          }));
                        }}
                      />
                      {(!isPageTranslated || showOriginal) && highlightColours.length > 0 && (
                        <PdfHighlightLayer
                          highlights={pageHighlights}
                          colours={highlightColours}
                          pageContainerEl={pageRefs.current[index]}
                          renderVersion={pageRenderVersions[pageNumber] ?? 0}
                          onDelete={deleteHighlight}
                          notes={pdfNotes}
                          onCreateNote={createNote}
                          onUpdateNote={updateNote}
                          onDeleteNote={deleteNote}
                          userFirstName={userFirstName}
                          pendingNoteForSelection={pendingNoteSelection}
                          readOnly={!canEditAnnotations}
                          isLoggedIn={isLoggedIn}
                          explanations={explanations}
                          activeExplanationId={isExplainPanelOpen ? activeExplanationId : null}
                          onExplanationIconClick={handleExplanationIconClick}
                          pulsingExplanationId={pulsingExplanationId}
                          onPulseComplete={handlePulseComplete}
                          pendingNoteForExplanationId={pendingNoteExplanationId}
                        />
                      )}
                      {!showOriginal && translatedParagraphs && (
                        <PdfTranslationOverlay paragraphs={translatedParagraphs} />
                      )}
                    </div>
                  );
                })}
            </Document>
          )}
        </div>
      </div>

      {/* ── Side panel: Text Explanation or Chat with PDF ── */}
      {panelMode === 'chat-with-pdf' ? (
        <AskAISidePanel
          isOpen={isExplainPanelOpen}
          onClose={handleCloseExplainPanel}
          onInputSubmit={handleChatWithPdfSubmit}
          onStopRequest={handleChatWithPdfStop}
          onClearChat={handleClearChatWithPdf}
          isRequesting={isChatWithPdfRequesting}
          chatMessages={chatWithPdfMessages}
          streamingText={chatWithPdfStreaming}
          possibleQuestions={[]}
          headerTitle="Chat with PDF"
          mode="inline"
          builtinPrompts={['Summarise']}
        />
      ) : (
        <AskAISidePanel
          isOpen={isExplainPanelOpen}
          onClose={handleCloseExplainPanel}
          onInputSubmit={handleAskFollowUp}
          onStopRequest={handleStopExplainRequest}
          onClearChat={handleClearExplainChat}
          isRequesting={activeExplanation?.isRequesting ?? false}
          chatMessages={activeExplanation?.chatMessages ?? []}
          streamingText={activeExplanation?.streamingText ?? ''}
          possibleQuestions={activeExplanation?.possibleQuestions ?? []}
          headerTitle={activePanelTitle}
          mode="inline"
          onScrollToText={handleScrollToExplanationText}
          onSaveChat={handleSaveExplainChat}
          onDeleteChat={handleDeleteExplainChat}
          isChatSaved={!!activeExplanation?.textChatId}
          autoFocusInput={focusChatInput}
          onInputFocused={() => setFocusChatInput(false)}
          onHighlightText={canEditAnnotations ? handleHighlightFromPanel : undefined}
          onAddNote={canEditAnnotations ? handleAddNoteFromPanel : undefined}
          highlightColours={highlightColours}
          selectedColourId={selectedColourId}
          onHighlightColourChange={canEditAnnotations ? handleHighlightColourChange : undefined}
          activeColour={highlightColours.find((c) => c.id === selectedColourId)?.hexcode ?? '#fbbf24'}
          isTextHighlighted={highlights.some((h) => h.startText === activeExplanation?.startText)}
          onDeleteExplanation={handleClearExplainChat}
          customPrompts={userCustomPrompts}
          onAddCustomPrompt={() => setShowCreatePromptModal(true)}
        />
      )}

      {/* ── Feature discovery step 1: toolbar spotlight ── */}
      {fdStep === 1 && viewState === 'ready' && spotlightRect && (
        <div className={styles.fdOverlay}>
          {/* Teal-bordered box over toolbar buttons */}
          <div
            className={styles.fdSpotlight}
            style={{
              top: spotlightRect.top,
              left: spotlightRect.left,
              width: spotlightRect.width,
              height: spotlightRect.height,
            }}
          />
          {/* Tooltip anchored below the spotlight */}
          <div
            className={styles.fdTooltip}
            style={{
              top: spotlightRect.top + spotlightRect.height + 14,
              left: spotlightRect.left + spotlightRect.width / 2,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <p className={styles.fdInstruction}>
              All tools available here
            </p>
            <button
              type="button"
              className={styles.fdNextBtn}
              onClick={handleFdNext}
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* ── Feature discovery step 2: highlight instruction ── */}
      {fdStep === 2 && viewState === 'ready' && (
        <div className={`${styles.fdOverlay} ${styles.fdOverlayDark}`}>
          <div
            className={styles.fdStep2Tooltip}
            onClick={(e) => e.stopPropagation()}
          >
            <p className={styles.fdInstruction}>
              Select any text and Ask AI, highlight text and add personal notes
            </p>
            <button
              type="button"
              className={styles.fdGotItBtn}
              onClick={handleFeatureDiscoveryDismiss}
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <CopyPdfModal
        isOpen={showCopyModal}
        onClose={() => setShowCopyModal(false)}
        pdfId={pdfId ?? ''}
        folders={allFolders}
        accessToken={accessToken ?? ''}
        onCopied={(newId) => navigate(`/pdf/${newId}`)}
      />

      <PdfShareModal
        isOpen={showShareModal}
        onClose={() => { setShowShareModal(false); setPdfShareeList([]); }}
        onShare={handleSharePdfSubmit}
        onMakePublic={handleMakePdfPublic}
        onMakePrivate={handleMakePdfPrivate}
        title={`Share "${pdfDetails?.file_name ?? ''}"`}
        accessLevel={pdfDetails?.access_level ?? 'PRIVATE'}
        pdfId={pdfId ?? ''}
        isOwner={isOwner}
        sharees={pdfShareeList}
        isLoadingSharees={isPdfShareeListLoading}
        onUnshare={handleUnsharePdf}
        onFetchSharees={handleFetchSharees}
      />

      <PdfUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        folderId={pdfDetails?.folder_id}
        folderName={resolvedFolderName ?? undefined}
      />

      {(showLoginModal || isLoginModalClosing) && (
        <>
          <div
            className={`${styles.modalOverlay} ${isLoginModalClosing ? styles.modalOverlayClosing : ''}`}
            onClick={() => {
              setIsLoginModalClosing(true);
              setTimeout(() => {
                setShowLoginModal(false);
                setIsLoginModalClosing(false);
              }, 300);
            }}
          />
          <div
            className={`${styles.modalContainer} ${isLoginModalClosing ? styles.modalContainerClosing : ''}`}
            onClick={(e) => e.stopPropagation()}
          >
            <LoginModal
              actionText="highlight text"
              onClose={() => {
                setIsLoginModalClosing(true);
                setTimeout(() => {
                  setShowLoginModal(false);
                  setIsLoginModalClosing(false);
                }, 300);
              }}
            />
          </div>
        </>
      )}

      <CreateCustomPromptModal
        isOpen={showCreatePromptModal}
        onClose={() => setShowCreatePromptModal(false)}
        onCreated={(newPrompt) => setUserCustomPrompts(prev => [newPrompt, ...prev])}
      />
    </div>
  );
};

function ChatIcon() {
  return <MessageCircle size={16} aria-hidden="true" />;
}

PdfDetail.displayName = 'PdfDetail';
