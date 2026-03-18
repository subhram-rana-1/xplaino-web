import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import { Plus, ChevronLeft, ChevronRight, Eye, EyeOff, Share2, Download, MessageCircle, Trash2, Users } from 'lucide-react';
import styles from './PdfDetail.module.css';
import { useAuth } from '@/shared/hooks/useAuth';
import { getPdfById, getAllPdfs, sharePdf, makePdfPublic, makePdfPrivate, getPdfShareeList, unsharePdf, getDownloadUrl, deletePdf } from '@/shared/services/pdf.service';
import { getAllFolders, getSharedToEmails } from '@/shared/services/folders.service';
import type { FolderWithSubFolders, ShareeItem } from '@/shared/types/folders.types';
import { getUserSettings, updateUserSettings } from '@/shared/services/user-settings.service';
import type { PdfResponse } from '@/shared/types/pdf.types';
import type { SettingsResponse } from '@/shared/types/user-settings.types';
import { Toast } from '@/shared/components/Toast';
import { PdfUploadModal } from '@/shared/components/PdfUploadModal';
import { LoginModal } from '@/shared/components/LoginModal';
import { PdfTranslationOverlay } from './PdfTranslationOverlay';
import { usePdfTranslation } from './usePdfTranslation';
import { usePdfHighlights } from './usePdfHighlights';
import { usePdfNotes } from './usePdfNotes';
import { PdfSelectionTrigger } from './PdfSelectionTrigger';
import { PdfHighlightLayer } from './PdfHighlightLayer';
import { FolderSelectorPopover } from '@/shared/components/FolderSelectorPopover';
import { PdfSelectorPopover } from '@/shared/components/PdfSelectorPopover';
import { PdfShareModal } from '@/shared/components/PdfShareModal';
import { ShareeListModal } from '@/shared/components/ShareeListModal';
import { CopyPdfModal } from '@/shared/components/CopyPdfModal';
import { PdfChatPanel } from './PdfChatPanel';
import { CreateCustomPromptModal } from '@/shared/components/CreateCustomPromptModal';
import { listCustomPrompts } from '@/shared/services/customPrompt.service';
import type { CustomPromptResponse } from '@/shared/types/customPrompt.types';
import { normalisePdfText } from './pdfTextNormalise';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { PdfLoadingScreen } from './PdfLoadingScreen';

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
  const [isTranslationActive] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const [userSettings, setUserSettings] = useState<SettingsResponse | null>(null);
  const mainAreaRef = useRef<HTMLDivElement>(null);

  // Container width for full-size pages
  const [containerWidth, setContainerWidth] = useState<number | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Per-page refs for scroll-to
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [activePage, setActivePage] = useState<number>(1);

  // Auto-update activePage as the user scrolls so the sidebar thumbnail tracks
  // the page currently visible at the centre of the viewport.
  useEffect(() => {
    const scrollEl = mainAreaRef.current;
    if (!scrollEl) return;

    const handler = () => {
      const refs = pageRefs.current;
      if (!refs.length) return;

      const viewMid = scrollEl.scrollTop + scrollEl.clientHeight / 2;
      let best = 1;
      let bestDist = Infinity;

      for (let i = 0; i < refs.length; i++) {
        const el = refs[i];
        if (!el) continue;
        const elMid = el.offsetTop + el.offsetHeight / 2;
        const dist = Math.abs(elMid - viewMid);
        if (dist < bestDist) {
          bestDist = dist;
          best = i + 1;
        }
      }

      setActivePage((prev) => (prev === best ? prev : best));
    };

    scrollEl.addEventListener('scroll', handler, { passive: true });
    return () => scrollEl.removeEventListener('scroll', handler);
  }, [numPages]);

  // Per-page render version counters so PdfHighlightLayer recomputes rects on re-render
  const [pageRenderVersions, setPageRenderVersions] = useState<Record<number, number>>({});

  // Pending note triggered from the text-selection trigger
  const [pendingNoteSelection, setPendingNoteSelection] = useState<{
    startText: string;
    endText: string;
    clientY: number;
  } | null>(null);

  const [isExplainPanelOpen, setIsExplainPanelOpen] = useState(false);
  const [chatSelectedText, setChatSelectedText] = useState<string | undefined>(undefined);
  const [pendingChatPrompt, setPendingChatPrompt] = useState<string | undefined>(undefined);
  const [activeCitationHighlight, setActiveCitationHighlight] = useState<{
    id: string;
    startText: string;
    endText: string;
    pageNumber?: number;
  } | null>(null);

  const handleExplainFromSelection = useCallback(
    (_startText: string, _endText: string, selectedText: string, _clientY: number) => {
      setChatSelectedText(selectedText);
      setPendingChatPrompt('Simplify this text');
      setIsExplainPanelOpen(true);
    },
    [],
  );

  const handleAskAIFromSelection = useCallback(
    (_startText: string, _endText: string, selectedText: string, _clientY: number) => {
      setChatSelectedText(selectedText);
      setPendingChatPrompt(undefined);
      setIsExplainPanelOpen(true);
    },
    [],
  );

  const handlePromptFromSelection = useCallback(
    (_startText: string, _endText: string, selectedText: string, _clientY: number, prompt: string) => {
      setChatSelectedText(selectedText);
      setPendingChatPrompt(prompt);
      setIsExplainPanelOpen(true);
    },
    [],
  );

  const handleCustomPromptFromSelection = useCallback(
    (_title: string, startText: string, endText: string, selectedText: string, clientY: number, promptText: string) => {
      handlePromptFromSelection(startText, endText, selectedText, clientY, promptText);
    },
    [handlePromptFromSelection],
  );

  const handleScrollToPage = useCallback((pageNumber: number) => {
    const pageEl = contentRef.current?.querySelector(
      `[data-page="${pageNumber}"]`,
    );
    pageEl?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const handleScrollToSelectedText = useCallback(
    (text: string, pageHint?: number | null, noPulse?: boolean) => {
      if (!contentRef.current || !text) return;
      const fullNeedle = normalisePdfText(text).toLowerCase();
      if (!fullNeedle) return;

      type PageBuf = { buf: string; charSpan: HTMLElement[] };
      const pageBuffers = new Map<number, PageBuf>();

      const allPages = Array.from(
        contentRef.current.querySelectorAll<HTMLElement>('[data-page]'),
      );

      for (const page of allPages) {
        const pageNum = parseInt(page.getAttribute('data-page') ?? '0', 10);
        const spans = Array.from(
          page.querySelectorAll<HTMLElement>('.react-pdf__Page__textContent span'),
        );
        if (!spans.length) continue;

        let buf = '';
        const charSpan: HTMLElement[] = [];
        for (const span of spans) {
          const t = normalisePdfText(span.textContent ?? '');
          if (!t) continue;
          if (buf.length > 0 && !buf.endsWith(' ') && !t.startsWith(' ')) {
            buf += ' ';
            charSpan.push(span);
          }
          for (const ch of t) {
            buf += ch;
            charSpan.push(span);
          }
        }
        pageBuffers.set(pageNum, { buf, charSpan });
      }

      const searchOrder: PageBuf[] = [];
      if (pageHint != null && pageBuffers.has(pageHint)) {
        searchOrder.push(pageBuffers.get(pageHint)!);
      }
      for (const [num, pb] of pageBuffers) {
        if (num !== pageHint) searchOrder.push(pb);
      }

      const NEEDLE_LENGTHS = [300, 150, 80, 40];
      let matchSpan: HTMLElement | null = null;

      for (const maxLen of NEEDLE_LENGTHS) {
        const needle = fullNeedle.slice(0, maxLen);
        if (!needle) continue;

        for (const { buf, charSpan } of searchOrder) {
          const lowerBuf = buf.toLowerCase();

          let idx = lowerBuf.indexOf(needle);

          if (idx === -1) {
            const compactBuf = lowerBuf.replace(/ /g, '');
            const compactNeedle = needle.replace(/ /g, '');
            const compactIdx = compactBuf.indexOf(compactNeedle);
            if (compactIdx !== -1) {
              let origIdx = 0;
              let compactCount = 0;
              while (compactCount < compactIdx && origIdx < buf.length) {
                if (buf[origIdx] !== ' ') compactCount++;
                origIdx++;
              }
              while (origIdx < buf.length && buf[origIdx] === ' ') origIdx++;
              idx = origIdx;
            }
          }

          if (idx !== -1) {
            matchSpan = charSpan[idx] ?? null;
            break;
          }
        }
        if (matchSpan) break;
      }

      if (!matchSpan) return;
      matchSpan.scrollIntoView({ behavior: 'smooth', block: 'center' });

      if (!noPulse) {
        const PULSE_CLASS = 'xplaino-text-pulse';
        const pulse = () => {
          matchSpan!.classList.add(PULSE_CLASS);
          setTimeout(() => {
            matchSpan!.classList.remove(PULSE_CLASS);
            setTimeout(() => {
              matchSpan!.classList.add(PULSE_CLASS);
              setTimeout(() => matchSpan!.classList.remove(PULSE_CLASS), 400);
            }, 200);
          }, 400);
        };
        setTimeout(pulse, 450);
      }
    },
    [],
  );

  const handleSendToChatFromSelection = useCallback((text: string) => {
    setChatSelectedText(text);
    setIsExplainPanelOpen(true);
  }, []);

  const handleCloseExplainPanel = useCallback(() => {
    setIsExplainPanelOpen(false);
    setActiveCitationHighlight(null);
  }, []);

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


  // Notes
  const { notes: pdfNotes, createNote, updateNote, deleteNote } = usePdfNotes({ pdfId, accessToken: accessToken ?? null, isPublic });

  // Translation hook
  const { pageTranslations } = usePdfTranslation({
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
  const [showManageSharingModal, setShowManageSharingModal] = useState(false);
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [pdfShareeList, setPdfShareeList] = useState<ShareeItem[]>([]);
  const [isPdfShareeListLoading, setIsPdfShareeListLoading] = useState(false);
  const [showCreatePromptModal, setShowCreatePromptModal] = useState(false);
  const [userCustomPrompts, setUserCustomPrompts] = useState<CustomPromptResponse[]>([]);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleDeleteConfirm = useCallback(async () => {
    if (!pdfId || !accessToken) return;
    setIsDeleting(true);
    try {
      await deletePdf(accessToken, pdfId);
      setShowDeleteConfirm(false);
      navigate(`/user/dashboard/folder/${folderId}/pdf`, { state: { folderName } });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete PDF';
      setToast({ message: errorMessage, type: 'error' });
      setShowDeleteConfirm(false);
    } finally {
      setIsDeleting(false);
    }
  }, [pdfId, accessToken, folderId, folderName, navigate]);

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

  const handleOpenManageSharing = useCallback(async () => {
    if (!accessToken || !pdfId) return;
    setIsPdfShareeListLoading(true);
    setShowManageSharingModal(true);
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

  // Stable PDF.js options: cMapUrl ensures correct CID-font character mappings and
  // standardFontDataUrl provides accurate font metrics, both of which are necessary
  // for the text layer to be positioned correctly over the canvas.
  // Version matches the pdfjs worker already in use (pdfjs.GlobalWorkerOptions.workerSrc).
  const pdfOptions = useMemo(() => ({
    cMapUrl: 'https://unpkg.com/pdfjs-dist@5.4.296/cmaps/',
    cMapPacked: true,
    standardFontDataUrl: 'https://unpkg.com/pdfjs-dist@5.4.296/standard_fonts/',
  }), []);

  // Memoize computed page width so sub-pixel ResizeObserver fluctuations don't
  // trigger unnecessary page re-renders and text layer recomputations.
  const pageWidth = useMemo(
    () => (containerWidth ? Math.round(containerWidth * zoomLevel) : undefined),
    [containerWidth, zoomLevel],
  );

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
                  ref={activePage === index + 1 ? (el) => { el?.scrollIntoView({ block: 'nearest' }); } : undefined}
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
          <PdfLoadingScreen />
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
      {/* Global keyframes for the "scroll-to-selected-text" pulse effect. */}
      <style>{`
        @keyframes xplainoPulse {
          0%   { background: transparent; border-radius: 2px; }
          40%  { background: rgba(13, 128, 112, 0.35); border-radius: 2px; }
          100% { background: transparent; border-radius: 2px; }
        }
        .xplaino-text-pulse {
          animation: xplainoPulse 0.4s ease-in-out;
        }
      `}</style>
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
              {!isExplainPanelOpen && <button
                type="button"
                className={styles.chatWithPdfBtn}
                onClick={() => setIsExplainPanelOpen(true)}
                title="Chat with PDF"
              >
                <ChatIcon />
                <span>Chat with PDF</span>
                <kbd className={styles.chatWithPdfKbd}>{isMac ? '⌘B' : 'Ctrl+B'}</kbd>
              </button>}
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
                  onClick={() => setShowShareModal(true)}
                  aria-label="Share PDF"
                >
                  <Share2 size={16} />
                </button>
                <span className={styles.iconBtnTooltip}>Share</span>
              </div>
              <div className={styles.iconBtnWrapper}>
                <button
                  type="button"
                  className={styles.iconBtn}
                  onClick={handleOpenManageSharing}
                  aria-label="Manage sharing"
                >
                  <Users size={16} />
                </button>
                <span className={styles.iconBtnTooltip}>Manage sharing</span>
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
                  onClick={() => setShowDeleteConfirm(true)}
                  aria-label="Delete PDF"
                >
                  <Trash2 size={16} />
                </button>
                <span className={styles.iconBtnTooltip}>Delete</span>
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
              onChatWithSelection={handleSendToChatFromSelection}
            />
          )}
          {downloadUrl && (
            <Document
              file={downloadUrl}
              options={pdfOptions}
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
                        width={pageWidth}
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
                          explanations={
                            activeCitationHighlight && (
                              activeCitationHighlight.pageNumber == null ||
                              activeCitationHighlight.pageNumber === pageNumber
                            )
                              ? [activeCitationHighlight]
                              : []
                          }
                          activeExplanationId={activeCitationHighlight?.id ?? null}
                          onExplanationIconClick={() => {}}
                          pulsingExplanationId={null}
                          onPulseComplete={() => {}}
                          pendingNoteForExplanationId={null}
                          hideExplanationIcons={!!activeCitationHighlight}
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

      {/* ── Chat panel toggle — only shown when panel is closed ── */}
      {!isExplainPanelOpen && (
        <button
          type="button"
          className={`${styles.chatPanelToggle} ${styles.chatPanelToggleCollapsed}`}
          onClick={() => setIsExplainPanelOpen(true)}
          title="Show chat"
          aria-label="Show chat"
        >
          <ChevronLeft size={14} />
        </button>
      )}

      {/* ── Side panel: Chat with PDF ── */}
      <PdfChatPanel
        isOpen={isExplainPanelOpen}
        onClose={handleCloseExplainPanel}
        pdfId={pdfId!}
        accessToken={accessToken}
        onScrollToPage={handleScrollToPage}
        onScrollToSelectedText={handleScrollToSelectedText}
        onHighlightCitation={setActiveCitationHighlight}
        selectedText={chatSelectedText}
        onClearSelectedText={() => setChatSelectedText(undefined)}
        pendingPrompt={pendingChatPrompt}
        onClearPendingPrompt={() => setPendingChatPrompt(undefined)}
        customPrompts={userCustomPrompts}
        onCreatePrompt={() => setShowCreatePromptModal(true)}
        onCustomPromptsChanged={(prompts) => setUserCustomPrompts(prompts)}
      />

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
        onFetchSuggestedEmails={accessToken ? () => getSharedToEmails(accessToken) : undefined}
      />

      <ShareeListModal
        isOpen={showManageSharingModal}
        onClose={() => { setShowManageSharingModal(false); setPdfShareeList([]); }}
        title={`Sharing: "${pdfDetails?.file_name ?? ''}"`}
        sharees={pdfShareeList}
        isLoading={isPdfShareeListLoading}
        onUnshare={handleUnsharePdf}
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

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete PDF"
        message="Are you sure you want to delete this PDF? This action cannot be undone."
        confirmText={isDeleting ? 'Deleting...' : 'Delete'}
        cancelText="Cancel"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
};

function ChatIcon() {
  return <MessageCircle size={16} aria-hidden="true" />;
}

PdfDetail.displayName = 'PdfDetail';
