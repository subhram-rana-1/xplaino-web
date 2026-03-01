import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import { FiPlus, FiList, FiExternalLink, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import styles from './PdfDetail.module.css';
import { useAuth } from '@/shared/hooks/useAuth';
import { getPdfById, getAllPdfs } from '@/shared/services/pdf.service';
import type { PdfResponse } from '@/shared/types/pdf.types';
import { Toast } from '@/shared/components/Toast';
import { PdfUploadModal } from '@/shared/components/PdfUploadModal';

// PDF.js worker: use same version as react-pdf's pdfjs-dist (5.4.296)
pdfjs.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@5.4.296/build/pdf.worker.min.mjs';

type ViewState = 'loading' | 'not_found' | 'no_file' | 'ready' | 'error';

const PDF_SIDEBAR_VISIBLE_KEY = 'xplaino-pdf-sidebar-visible';
const PDF_REFRESH_BANNER_DISMISSED_KEY = 'xplaino-pdf-refresh-banner-dismissed';

function getStoredPdfSidebarVisible(): boolean {
  try {
    const stored = localStorage.getItem(PDF_SIDEBAR_VISIBLE_KEY);
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
  const { accessToken, isLoggedIn, isLoading: authLoading } = useAuth();

  const [sidebarVisible, setSidebarVisible] = useState(getStoredPdfSidebarVisible);

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

  // PDF data
  const [pdfDetails, setPdfDetails] = useState<PdfResponse | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [viewState, setViewState] = useState<ViewState>('loading');
  const [numPages, setNumPages] = useState<number | null>(null);
  const [toast, setToast] = useState<{ message: string; type?: 'success' | 'error' } | null>(null);

  // Container width for full-size pages
  const [containerWidth, setContainerWidth] = useState<number | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Per-page refs for scroll-to
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [activePage, setActivePage] = useState<number>(1);

  // Folder PDFs list
  const [showFolderPdfs, setShowFolderPdfs] = useState(false);
  const [folderPdfs, setFolderPdfs] = useState<PdfResponse[]>([]);
  const [folderPdfsLoading, setFolderPdfsLoading] = useState(false);
  const [hoveredFolderPdfId, setHoveredFolderPdfId] = useState<string | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

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

  // Load PDF data
  useEffect(() => {
    if (authLoading || !pdfId) return;

    let cancelled = false;

    const loadPdf = async () => {
      try {
        setViewState('loading');

        const token = isLoggedIn ? (accessToken ?? null) : null;
        const pdf = await getPdfById(pdfId, token);

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

  const onDocumentLoadSuccess = ({ numPages: n }: { numPages: number }) => {
    setNumPages(n);
    pageRefs.current = new Array(n).fill(null);
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

  const handleToggleFolderPdfs = useCallback(async () => {
    if (showFolderPdfs) {
      setShowFolderPdfs(false);
      return;
    }
    const resolvedFolderId = pdfDetails?.folder_id;
    if (!resolvedFolderId || !accessToken) return;

    setShowFolderPdfs(true);
    setFolderPdfsLoading(true);
    try {
      const result = await getAllPdfs(accessToken, resolvedFolderId);
      setFolderPdfs(result.pdfs ?? []);
    } catch (err) {
      setToast({ message: err instanceof Error ? err.message : 'Failed to load PDFs', type: 'error' });
      setShowFolderPdfs(false);
    } finally {
      setFolderPdfsLoading(false);
    }
  }, [showFolderPdfs, pdfDetails, accessToken]);

  const buildPdfUrl = (id: string) => {
    const resolvedFolderId = pdfDetails?.folder_id;
    const params = new URLSearchParams({
      ...(resolvedFolderId ? { folderId: resolvedFolderId } : {}),
      ...(folderName ? { folderName } : {}),
    });
    return `/pdf/${id}${params.toString() ? `?${params}` : ''}`;
  };

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
        {pdfDetails?.folder_id && (
          <button
            className={styles.sidebarBtn}
            onClick={handleToggleFolderPdfs}
            title={showFolderPdfs ? 'Hide all' : 'Folder PDFs'}
          >
            <FiList size={15} />
            <span>{showFolderPdfs ? 'Hide all' : 'Folder PDFs'}</span>
          </button>
        )}
      </div>

      {showFolderPdfs ? (
        <div className={styles.folderPdfList}>
          {folderPdfsLoading ? (
            <div className={styles.folderPdfsLoading}>Loading…</div>
          ) : folderPdfs.length === 0 ? (
            <div className={styles.folderPdfsLoading}>No PDFs in folder.</div>
          ) : (
            folderPdfs.map(pdf => (
              <div
                key={pdf.id}
                className={`${styles.folderPdfItem} ${pdf.id === pdfId ? styles.folderPdfItemActive : ''}`}
                onClick={() => navigate(buildPdfUrl(pdf.id))}
                onMouseEnter={() => setHoveredFolderPdfId(pdf.id)}
                onMouseLeave={() => setHoveredFolderPdfId(null)}
                title={pdf.file_name}
              >
                <span className={styles.folderPdfName}>{pdf.file_name}</span>
                <button
                  className={`${styles.folderPdfOpenBtn} ${hoveredFolderPdfId === pdf.id ? styles.folderPdfOpenBtnVisible : ''}`}
                  onClick={e => { e.stopPropagation(); window.open(buildPdfUrl(pdf.id), '_blank', 'noopener,noreferrer'); }}
                  title="Open in new tab"
                  aria-label="Open in new tab"
                >
                  <FiExternalLink size={13} />
                </button>
              </div>
            ))
          )}
        </div>
      ) : (
        downloadUrl && numPages !== null && (
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
        )
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

      <div className={styles.mainArea}>
        <div className={styles.mainHeader}>
          {pdfDetails && (
            folderName ? (
              <div className={styles.pdfBreadcrumb}>
                <Link to="/user/dashboard/pdf" className={styles.pdfBreadcrumbLink}>My PDFs</Link>
                <span className={styles.pdfBreadcrumbSeparator}>/</span>
                {folderId ? (
                  <Link to={`/user/dashboard/pdf/folder/${folderId}`} className={styles.pdfBreadcrumbLink}>{folderName}</Link>
                ) : (
                  <span className={styles.pdfBreadcrumbPart}>{folderName}</span>
                )}
                <span className={styles.pdfBreadcrumbSeparator}>/</span>
                <span className={styles.pdfBreadcrumbCurrent}>{pdfDetails.file_name}</span>
              </div>
            ) : (
              <h3 className={styles.pdfTitle}>{pdfDetails.file_name}</h3>
            )
          )}
          {numPages !== null && (
            <span className={styles.pageInfo}>{numPages} page{numPages !== 1 ? 's' : ''}</span>
          )}
        </div>

        <div className={styles.content} ref={contentRef}>
          {downloadUrl && (
            <Document
              file={downloadUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading={<div className={styles.loading}>Loading document…</div>}
              className={styles.document}
            >
              {numPages !== null &&
                Array.from(new Array(numPages), (_, index) => (
                  <div
                    key={`page-${index + 1}`}
                    ref={el => { pageRefs.current[index] = el; }}
                    className={styles.pageWrapper}
                  >
                    <Page
                      pageNumber={index + 1}
                      renderTextLayer={true}
                      renderAnnotationLayer={true}
                      className={styles.page}
                      width={containerWidth ?? undefined}
                    />
                  </div>
                ))}
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
        folderName={folderName ?? undefined}
      />
    </div>
  );
};

PdfDetail.displayName = 'PdfDetail';
