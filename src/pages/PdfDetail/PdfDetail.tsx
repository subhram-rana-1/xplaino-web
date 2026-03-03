import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import { FiPlus, FiChevronLeft, FiChevronRight, FiChevronDown, FiEyeOff } from 'react-icons/fi';
import styles from './PdfDetail.module.css';
import { useAuth } from '@/shared/hooks/useAuth';
import { getPdfById, getAllPdfs } from '@/shared/services/pdf.service';
import { getAllFolders } from '@/shared/services/folders.service';
import type { FolderWithSubFolders } from '@/shared/types/folders.types';
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
import { PdfHighlightColorPicker } from './PdfHighlightColorPicker';
import { PdfSelectionTrigger } from './PdfSelectionTrigger';
import { PdfHighlightLayer } from './PdfHighlightLayer';
import { FolderSelectorPopover } from '@/shared/components/FolderSelectorPopover';
import { PdfSelectorPopover } from '@/shared/components/PdfSelectorPopover';

// PDF.js worker: use same version as react-pdf's pdfjs-dist (5.4.296)
pdfjs.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@5.4.296/build/pdf.worker.min.mjs';

type ViewState = 'loading' | 'not_found' | 'no_file' | 'ready' | 'error';

const PDF_SIDEBAR_VISIBLE_KEY = 'xplaino-pdf-sidebar-visible';
const PDF_TOOLBAR_VISIBLE_KEY = 'xplaino-pdf-toolbar-visible';
const PDF_REFRESH_BANNER_DISMISSED_KEY = 'xplaino-pdf-refresh-banner-dismissed';

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

  const [sidebarVisible, setSidebarVisible] = useState(getStoredPdfSidebarVisible);
  const [toolbarVisible, setToolbarVisible] = useState(getStoredToolbarVisible);

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

  const handleWriteNoteFromSelection = useCallback(
    (startText: string, endText: string, clientY: number) => {
      setPendingNoteSelection({ startText, endText, clientY });
      // Reset after a tick so PdfHighlightLayer treats each click as a fresh trigger
      setTimeout(() => setPendingNoteSelection(null), 100);
    },
    [],
  );

  // Highlights
  const {
    colours: highlightColours,
    selectedColourId,
    setSelectedColourId,
    highlights,
    createHighlight,
    deleteHighlight,
  } = usePdfHighlights({ pdfId, accessToken: accessToken ?? null });

  // Notes
  const { notes: pdfNotes, createNote, updateNote, deleteNote } = usePdfNotes({ pdfId, accessToken: accessToken ?? null });

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
      {sidebarVisible ? <FiChevronLeft size={14} /> : <FiChevronRight size={14} />}
    </button>
  );

  // Sidebar JSX (shared across states)
  const sidebar = (
    <aside className={`${styles.sidebar} ${!sidebarVisible ? styles.sidebarHidden : ''}`}>
      <div className={styles.sidebarButtons}>
        <button className={styles.sidebarBtn} onClick={handleNewPdf} title="New PDF">
          <FiPlus size={15} />
          <span>New PDF</span>
        </button>
      </div>

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

        {/* ── Sticky horizontal toolbar ── */}
        <div className={styles.toolbar}>
          <div className={`${styles.toolbarBody} ${!toolbarVisible ? styles.toolbarBodyHidden : ''}`}>
            <div className={styles.toolbarSpacer} />
            <div className={styles.toolbarButtons}>
              <PdfTranslateButton
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
              />
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
              <PdfHighlightColorPicker
                colours={highlightColours}
                selectedColourId={selectedColourId}
                onColourChange={handleHighlightColourChange}
              />
            </div>
            <div className={styles.toolbarEndActions}>
              <button
                type="button"
                className={styles.toolbarHideBtn}
                onClick={() => setToolbarVisible(false)}
                title="Hide toolbar"
                aria-label="Hide toolbar"
              >
                <FiEyeOff size={14} />
              </button>
            </div>
          </div>
          <div className={styles.toolbarFooter}>
            {!toolbarVisible && (
              <button
                type="button"
                className={styles.toolbarRevealBtn}
                onClick={() => setToolbarVisible(true)}
                title="Show toolbar"
                aria-label="Show toolbar"
              >
                <FiChevronDown size={14} />
              </button>
            )}
          </div>
        </div>

        <div className={styles.mainHeader}>
          <div className={styles.mainHeaderTop}>
            <div className={styles.pdfBreadcrumb}>
              <button
                className={styles.pdfBreadcrumbBack}
                onClick={() => navigate('/user/dashboard')}
              >
                ← Dashboard
              </button>
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
            {numPages !== null && (
              <span className={styles.pageInfo}>{numPages} page{numPages !== 1 ? 's' : ''}</span>
            )}
          </div>
        </div>

        {pdfDetails && (
          <h2 className={styles.pdfFileHeading}>
            {pdfDetails.file_name.replace(/\.pdf$/i, '')}
          </h2>
        )}

        <div className={styles.content} ref={contentRef}>
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
          />
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
                        width={containerWidth ?? undefined}
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

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

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
    </div>
  );
};

PdfDetail.displayName = 'PdfDetail';
