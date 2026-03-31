import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { CloudUpload, FileText, Check, AlertCircle, RefreshCw, ArrowRight, Info, Bookmark, Monitor, MessageSquare, NotebookPen, Highlighter, Users, Star } from 'lucide-react';
import { SiGoogledrive, SiDropbox } from 'react-icons/si';
import { useAuth } from '@/shared/hooks/useAuth';
import { fetchPublic, fetchWithAuth } from '@/shared/services/api-client';
import { getUnauthenticatedUserId } from '@/shared/services/auth.service';
import { authConfig } from '@/config/auth.config';
import { getAllFolders } from '@/shared/services/folders.service';
import type { FolderWithSubFolders } from '@/shared/types/folders.types';
import styles from './ToolsPdfPage.module.css';

function flattenFolders(folders: FolderWithSubFolders[]): FolderWithSubFolders[] {
  return folders.flatMap((f) => [f, ...flattenFolders(f.subFolders || [])]);
}

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB

type Tab = 'local' | 'drive' | 'dropbox';
type PageState = 'idle' | 'processing' | 'success';

interface UploadedFile {
  name: string;
  size: number;
  source: 'local' | 'drive' | 'dropbox';
}

interface UnauthPdf {
  id: string;
  file_name: string;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function isPdfFile(file: File): boolean {
  return (
    file.type === 'application/pdf' ||
    file.name.toLowerCase().endsWith('.pdf')
  );
}


export const ToolsPdfPage: React.FC = () => {
  const { isLoggedIn, isLoading, accessToken } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<Tab>('local');
  const [pageState, setPageState] = useState<PageState>('idle');
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Local upload state
  const [isDropZoneHovered, setIsDropZoneHovered] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Full-viewport drag overlay
  const [isDraggingOverViewport, setIsDraggingOverViewport] = useState(false);
  const dragCounterRef = useRef(0);

  // Prior PDFs for unauthenticated users
  const [unauthPdfs, setUnauthPdfs] = useState<UnauthPdf[]>([]);
  const [unauthPdfsLoading, setUnauthPdfsLoading] = useState(false);

  // Recent PDFs row overflow detection
  const [viewAllOpen, setViewAllOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState<number | null>(null);
  const recentRowRef = useRef<HTMLDivElement>(null);

  // Processing message cycling
  const [processingMsg, setProcessingMsg] = useState('Uploading to secure storage…');
  const processingMessages = [
    'Uploading to secure storage…',
    'Creating PDF record…',
    'Finalising…',
  ];

  // Logged-in users: redirect to the most recently updated folder's PDF tab.
  useEffect(() => {
    if (!isLoggedIn || isLoading || !accessToken) return;

    getAllFolders(accessToken)
      .then((res) => {
        const all = flattenFolders(res.folders);
        if (all.length === 0) return;
        const mostRecent = all.reduce((a, b) =>
          new Date(b.updated_at) > new Date(a.updated_at) ? b : a
        );
        navigate(`/user/dashboard/folder/${mostRecent.id}/pdf`, { replace: true });
      })
      .catch(() => {
        // Silently ignore — stay on the upload page
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, isLoading, accessToken]);

  // Fetch prior PDFs for unauthenticated users who have an existing unauthenticated user ID.
  useEffect(() => {
    if (isLoggedIn || isLoading) return;

    const fetchUnauthPdfs = async () => {
      const unauthUserId = await getUnauthenticatedUserId();
      if (!unauthUserId) return;

      setUnauthPdfsLoading(true);
      try {
        const response = await fetchPublic(`${authConfig.catenBaseUrl}/api/pdf`);
        if (response.ok) {
          const data = await response.json();
          setUnauthPdfs(data.pdfs ?? []);
        }
      } catch {
        // Silently ignore — sidebar simply won't appear
      } finally {
        setUnauthPdfsLoading(false);
      }
    };

    fetchUnauthPdfs();
  }, [isLoggedIn, isLoading]);

  // Detect overflow in the recent PDFs row and compute how many chips fit
  useEffect(() => {
    if (!recentRowRef.current || unauthPdfs.length === 0) return;

    const measure = () => {
      const row = recentRowRef.current;
      if (!row) return;

      // Temporarily show all chips to measure
      const chips = Array.from(row.querySelectorAll<HTMLElement>('[data-pdf-chip]'));
      const viewAllBtn = row.querySelector<HTMLElement>('[data-view-all-btn]');
      const rowWidth = row.clientWidth;

      // Sum widths of label + gap to know remaining space
      const label = row.querySelector<HTMLElement>('[data-recent-label]');
      const gap = 8; // 0.5rem gap
      let usedWidth = label ? label.offsetWidth + gap : 0;
      const viewAllWidth = viewAllBtn ? viewAllBtn.offsetWidth + gap : 60 + gap;

      let count = 0;
      for (const chip of chips) {
        const chipWidth = chip.offsetWidth + gap;
        if (usedWidth + chipWidth + viewAllWidth > rowWidth) break;
        usedWidth += chipWidth;
        count++;
      }

      const allFit = count >= chips.length;
      setVisibleCount(allFit ? unauthPdfs.length : count);
    };

    // Run after paint so elements have their rendered sizes
    const frame = requestAnimationFrame(measure);
    const observer = new ResizeObserver(measure);
    if (recentRowRef.current) observer.observe(recentRowRef.current);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [unauthPdfs]);

  // Real upload flow for local files
  const uploadLocalFile = useCallback(
    async (file: File) => {
      if (isUploading) return;

      setIsUploading(true);
      setPageState('processing');
      setProcessingMsg(processingMessages[0]);

      // Use authenticated fetch for logged-in users so PDFs are tied to their account;
      // fall back to public fetch for unauthenticated users (sends X-Unauthenticated-User-Id).
      const apiFetch = isLoggedIn ? fetchWithAuth : fetchPublic;

      let msgIdx = 0;
      const interval = setInterval(() => {
        msgIdx = (msgIdx + 1) % processingMessages.length;
        setProcessingMsg(processingMessages[msgIdx]);
      }, 900);

      const stopProcessing = (error?: string) => {
        clearInterval(interval);
        setIsUploading(false);
        if (error) {
          setPageState('idle');
          setLocalError(error);
        }
      };

      try {
        // Step 1 — get presigned upload URL
        const presignedRes = await apiFetch(
          `${authConfig.catenBaseUrl}/api/file-upload/presigned-upload`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              file_name: file.name,
              file_type: 'PDF',
              entity_type: 'PDF',
            }),
          }
        );

        if (!presignedRes.ok) {
          const err = await presignedRes.json().catch(() => ({}));
          if (err?.detail?.errorCode === 'LOGIN_REQUIRED') {
            stopProcessing();
            setPageState('idle');
            window.dispatchEvent(new CustomEvent('loginRequired', { detail: { message: 'upload PDFs' } }));
            return;
          }
          const msg = err?.detail?.error_message || err?.detail || 'Failed to get upload URL.';
          stopProcessing(typeof msg === 'string' ? msg : 'Failed to get upload URL.');
          return;
        }

        const presignedData = await presignedRes.json();
        const { upload_url, file_upload_id, content_type } = presignedData;

        // Step 2 — PUT file directly to S3
        const s3Res = await fetch(upload_url, {
          method: 'PUT',
          headers: { 'Content-Type': content_type },
          body: file,
        });

        if (!s3Res.ok) {
          stopProcessing('Failed to upload file to storage. Please try again.');
          return;
        }

        // Step 3 — create PDF record
        const createPdfRes = await apiFetch(
          `${authConfig.catenBaseUrl}/api/pdf/create-pdf`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ file_name: file.name }),
          }
        );

        if (!createPdfRes.ok) {
          const err = await createPdfRes.json().catch(() => ({}));
          const msg = err?.detail?.error_message || err?.detail || 'Failed to create PDF record.';
          stopProcessing(typeof msg === 'string' ? msg : 'Failed to create PDF record.');
          return;
        }

        const pdfData = await createPdfRes.json();
        const pdfId: string = pdfData.id;

        // Step 4 — link file upload to the PDF record
        const updateEntityRes = await apiFetch(
          `${authConfig.catenBaseUrl}/api/file-upload/${file_upload_id}/entity`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ entity_id: pdfId }),
          }
        );

        if (!updateEntityRes.ok) {
          // Non-fatal — the PDF record was created; still navigate
          console.warn('Failed to link file upload to PDF record, continuing.');
        }

        // Step 5 — navigate to PDF page
        clearInterval(interval);
        setIsUploading(false);
        navigate(`/pdf/${pdfId}`);
      } catch (err) {
        stopProcessing('Something went wrong. Please try again.');
      }
    },
    [isUploading, isLoggedIn, navigate, processingMessages]
  );


  const handleFile = useCallback(
    (file: File) => {
      setLocalError(null);
      if (!isPdfFile(file)) {
        setLocalError('Only PDF files are accepted. Please select a .pdf file.');
        return;
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        setLocalError('File is too large. Maximum allowed size is 25 MB.');
        return;
      }
      uploadLocalFile(file);
    },
    [uploadLocalFile]
  );

  // File input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Drop zone events (on the card drop zone)
  const handleDropZoneDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDropZoneHovered(true);
  };

  const handleDropZoneDragLeave = () => {
    setIsDropZoneHovered(false);
  };

  const handleDropZoneDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDropZoneHovered(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  // Full-viewport drag listeners
  useEffect(() => {
    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      dragCounterRef.current += 1;
      if (dragCounterRef.current === 1) {
        setIsDraggingOverViewport(true);
      }
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      dragCounterRef.current -= 1;
      if (dragCounterRef.current <= 0) {
        dragCounterRef.current = 0;
        setIsDraggingOverViewport(false);
      }
    };

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      dragCounterRef.current = 0;
      setIsDraggingOverViewport(false);
      const file = e.dataTransfer?.files?.[0];
      if (file) {
        setActiveTab('local');
        handleFile(file);
      }
    };

    document.addEventListener('dragenter', handleDragEnter);
    document.addEventListener('dragleave', handleDragLeave);
    document.addEventListener('dragover', handleDragOver);
    document.addEventListener('drop', handleDrop);

    return () => {
      document.removeEventListener('dragenter', handleDragEnter);
      document.removeEventListener('dragleave', handleDragLeave);
      document.removeEventListener('dragover', handleDragOver);
      document.removeEventListener('drop', handleDrop);
    };
  }, [handleFile]);

  // Clipboard paste listener (Ctrl+V / Cmd+V)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const file = e.clipboardData?.files?.[0];
      if (file && isPdfFile(file)) {
        e.preventDefault();
        setActiveTab('local');
        handleFile(file);
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [handleFile]);


  const handleReset = () => {
    setPageState('idle');
    setUploadedFile(null);
    setLocalError(null);
  };

  const handleCtaClick = () => {
    if (isLoggedIn) {
      navigate('/user/dashboard');
    } else {
      window.dispatchEvent(
        new CustomEvent('loginRequired', { detail: { message: 'unlock all PDF features' } })
      );
    }
  };

  const sourceLabel: Record<UploadedFile['source'], string> = {
    local: 'Local file',
    drive: 'Google Drive',
    dropbox: 'Dropbox',
  };

  const sourceIcon: Record<UploadedFile['source'], React.ReactNode> = {
    local: <CloudUpload size={13} />,
    drive: <SiGoogledrive size={13} />,
    dropbox: <SiDropbox size={13} />,
  };

  return (
    <div className={styles.page}>
      {/* Full-viewport drag overlay */}
      {isDraggingOverViewport && pageState === 'idle' && (
        <div className={styles.dragOverlay}>
          <div className={styles.dragOverlayInner}>
            <CloudUpload className={styles.dragOverlayIcon} size={56} />
            <p className={styles.dragOverlayTitle}>Drop your PDF here</p>
            <p className={styles.dragOverlaySubtitle}>Release to upload</p>
          </div>
        </div>
      )}

      {/* Mobile — desktop-optimised notice */}
      <div className={styles.mobileNotice}>
        <Monitor className={styles.mobileNoticeIcon} aria-hidden />
        <div>
          <p className={styles.mobileNoticeTitle}>Best experienced on Desktop</p>
          <p className={styles.mobileNoticeText}>For the full PDF experience — chat, highlights, notes and more — open this page on a desktop browser.</p>
        </div>
      </div>

      {/* Hero */}
      <div className={styles.hero}>
        <h1 className={styles.heroTitle}>
          Drop your PDF.{' '}
          <span className={styles.heroTitleAccent}>Start asking questions.</span>
        </h1>
        <p className={styles.heroSubtitle}>
          Chat with any PDF — get answers, highlights, and notes in seconds. No signup needed.
        </p>
        <div className={styles.trustBar} aria-label="Social proof">
          <div className={styles.trustMetric}>
            <Star size={20} className={styles.trustStarIcon} aria-hidden />
            <span className={styles.trustMetricValue}>4.9/5</span>
            <span className={styles.trustMetricLabel}>on Chrome Web Store</span>
          </div>
          <a
            href="https://chromewebstore.google.com/detail/xplaino/nmphalmbdmddagbllhjnfnmodfmbnlkp"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.trustExtensionLink}
          >
            Try Extension — It's Free
          </a>
        </div>
      </div>

      {/* Recent PDFs row — shown below hero for unauthenticated users with prior uploads */}
      {!unauthPdfsLoading && unauthPdfs.length > 0 && (
        <div className={styles.recentPdfsRow} ref={recentRowRef}>
          <span className={styles.recentPdfsLabel} data-recent-label>Your PDFs</span>
          {(visibleCount === null ? unauthPdfs : unauthPdfs.slice(0, visibleCount)).map((pdf) => (
            <button
              key={pdf.id}
              className={styles.recentPdfChip}
              data-pdf-chip
              onClick={() => window.open(`/pdf/${pdf.id}`, '_blank')}
            >
              <FileText size={13} />
              <span>{pdf.file_name}</span>
            </button>
          ))}
          {visibleCount !== null && visibleCount < unauthPdfs.length && (
            <button
              className={styles.viewAllBtn}
              data-view-all-btn
              onClick={() => setViewAllOpen(true)}
            >
              View all
            </button>
          )}
        </div>
      )}

      {/* Outer row: inner two-column layout */}
      <div className={styles.outerRow}>

      {/* Inner row: feature list + upload card */}
      <div className={styles.mainRow}>

      {/* Feature list — left column */}
      <div className={styles.featuresColumn}>
        {[
          {
            label: 'Chat with PDF',
            icon: <MessageSquare size={22} />,
          },
          {
            label: 'Save and revisit past chats',
            icon: <NotebookPen size={22} />,
          },
          {
            label: 'Highlight, save personal notes',
            icon: <Highlighter size={22} />,
          },
          {
            label: 'Team collaboration',
            icon: <Users size={22} />,
          }
        ].map((item) => (
          <div key={item.label} className={styles.featureItem}>
            <div className={styles.featureItemIcon}>{item.icon}</div>
            <h2 className={styles.featureItemLabel}>{item.label}</h2>
          </div>
        ))}

        {/* CTA below feature list */}
        <div className={styles.featuresCta}>
          <p className={styles.featuresCtaText}>
            {isLoggedIn
              ? 'Access all your PDFs and folders from the dashboard.'
              : 'Upload a PDF above to try it free — create an account later to save your work.'}
          </p>
          <button className={styles.featuresCtaButton} onClick={handleCtaClick}>
            {isLoggedIn ? 'Go to Dashboard' : 'Create free account'}
            <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* Card */}
      <div className={styles.card}>
        {/* Tabs */}
        {/* TODO: Re-enable tabs once Drive/Dropbox backend proxy is implemented
        {pageState === 'idle' && (
          <div className={styles.tabs}>
            <button
              className={`${styles.tab} ${activeTab === 'local' ? styles.tabActive : ''}`}
              onClick={() => { setActiveTab('local'); setLocalError(null); setLinkError(null); }}
            >
              <CloudUpload className={styles.tabIcon} size={15} />
              Local file
            </button>
            <button
              className={`${styles.tab} ${activeTab === 'drive' ? styles.tabActive : ''}`}
              onClick={() => { setActiveTab('drive'); setLocalError(null); setLinkError(null); }}
            >
              <SiGoogledrive className={styles.tabIcon} size={14} />
              Google Drive
            </button>
            <button
              className={`${styles.tab} ${activeTab === 'dropbox' ? styles.tabActive : ''}`}
              onClick={() => { setActiveTab('dropbox'); setLocalError(null); setLinkError(null); }}
            >
              <SiDropbox className={styles.tabIcon} size={14} />
              Dropbox
            </button>
          </div>
        )}
        */}

        <div className={styles.cardBody}>
          {/* Processing state */}
          {pageState === 'processing' && (
            <div className={styles.processingState}>
              <div className={styles.processingSpinner} />
              <p className={styles.processingText}>{processingMsg}</p>
              <div className={styles.progressBar}>
                <div className={styles.progressBarFill} />
              </div>
              <p className={styles.processingSubText}>This only takes a moment</p>
            </div>
          )}

          {/* Success state */}
          {pageState === 'success' && uploadedFile && (
            <div className={styles.successState}>
              <div className={styles.successCheck}>
                <Check size={28} strokeWidth={2.5} />
              </div>
              <p className={styles.successTitle}>PDF loaded successfully!</p>
              <div className={styles.fileInfoCard}>
                <div className={styles.fileInfoIcon}>
                  <FileText size={24} />
                </div>
                <div className={styles.fileInfoDetails}>
                  <div className={styles.fileInfoName}>{uploadedFile.name}</div>
                  <div className={styles.fileInfoMeta}>
                    {uploadedFile.size > 0 && (
                      <span className={styles.fileInfoBadge}>
                        {formatFileSize(uploadedFile.size)}
                      </span>
                    )}
                    <span className={styles.fileInfoBadge}>
                      {sourceIcon[uploadedFile.source]}
                      {sourceLabel[uploadedFile.source]}
                    </span>
                    <span className={styles.fileInfoBadge}>PDF</span>
                  </div>
                </div>
              </div>
              <button className={styles.resetButton} onClick={handleReset}>
                <RefreshCw size={13} />
                Upload a different file
              </button>
            </div>
          )}

          {/* Idle — Local upload tab */}
          {pageState === 'idle' && activeTab === 'local' && (
            <>
              <div
                className={`${styles.dropZone} ${isDropZoneHovered ? styles.dropZoneHover : ''}`}
                onDragOver={handleDropZoneDragOver}
                onDragLeave={handleDropZoneDragLeave}
                onDrop={handleDropZoneDrop}
                onClick={() => fileInputRef.current?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click(); }}
              >
                <div className={styles.dropZoneIcon}>
                  <CloudUpload size={28} />
                </div>
                <p className={styles.dropZoneTitle}>Drag & drop your PDF here</p>
                <p className={styles.dropZoneSubtitle}>
                  Or paste a copied PDF file anywhere on this page (Ctrl+V / ⌘+V)
                </p>
                <div className={styles.dropZoneOr}>or</div>
                <button
                  type="button"
                  className={styles.browseButton}
                  onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                >
                  <FileText size={15} />
                  Browse file
                </button>
                <p className={styles.dropZoneHint}>
                  <Info size={12} />
                  PDF files only · Max 25 MB
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                className={styles.fileInput}
                onChange={handleFileInputChange}
              />
              {localError && (
                <div className={styles.errorMessage}>
                  <AlertCircle size={15} />
                  {localError}
                </div>
              )}
            </>
          )}

          {/* TODO: Re-enable once backend proxy is implemented (CORS blocks direct browser fetch)
          {pageState === 'idle' && activeTab === 'drive' && (
            <div className={styles.linkSection}>
              <p className={styles.linkLabel}>Google Drive PDF link</p>
              <p className={styles.linkDescription}>
                Paste a shareable link to a PDF stored in Google Drive. Make sure the
                file is set to "Anyone with the link can view".
              </p>
              <div className={styles.linkInputRow}>
                <input
                  type="url"
                  className={`${styles.linkInput} ${linkError ? styles.linkInputError : ''}`}
                  placeholder="https://drive.google.com/file/d/..."
                  value={driveUrl}
                  onChange={(e) => { setDriveUrl(e.target.value); setLinkError(null); }}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleDriveSubmit(); }}
                />
                <button
                  className={styles.linkSubmitButton}
                  onClick={handleDriveSubmit}
                  disabled={!driveUrl.trim()}
                >
                  <Link size={14} />
                  Load
                </button>
              </div>
              {linkError && (
                <div className={styles.linkError}>
                  <AlertCircle size={14} />
                  {linkError}
                </div>
              )}
              <div className={styles.linkHint}>
                <Info className={styles.linkHintIcon} size={14} />
                <span>
                  Open the file in Google Drive → click <strong>Share</strong> → set to
                  "Anyone with the link" → copy the link and paste it above.
                </span>
              </div>
            </div>
          )}

          {pageState === 'idle' && activeTab === 'dropbox' && (
            <div className={styles.linkSection}>
              <p className={styles.linkLabel}>Dropbox PDF link</p>
              <p className={styles.linkDescription}>
                Paste a shared link to a PDF stored in Dropbox. The file must be a PDF
                and the link must be publicly accessible.
              </p>
              <div className={styles.linkInputRow}>
                <input
                  type="url"
                  className={`${styles.linkInput} ${linkError ? styles.linkInputError : ''}`}
                  placeholder="https://www.dropbox.com/s/..."
                  value={dropboxUrl}
                  onChange={(e) => { setDropboxUrl(e.target.value); setLinkError(null); }}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleDropboxSubmit(); }}
                />
                <button
                  className={styles.linkSubmitButton}
                  onClick={handleDropboxSubmit}
                  disabled={!dropboxUrl.trim()}
                >
                  <Link size={14} />
                  Load
                </button>
              </div>
              {linkError && (
                <div className={styles.linkError}>
                  <AlertCircle size={14} />
                  {linkError}
                </div>
              )}
              <div className={styles.linkHint}>
                <Info className={styles.linkHintIcon} size={14} />
                <span>
                  Right-click the file in Dropbox → <strong>Share</strong> → copy the
                  link and paste it above.
                </span>
              </div>
            </div>
          )}
          */}
        </div>

      </div>


      {/* Extension promo — right column */}
      <div className={styles.extensionPromo}>
        <div className={styles.extensionPromoCard}>
          <p className={styles.extensionPromoHeading}>Also available as an Extension</p>
          {[
            { label: 'Chat with webpages', icon: <MessageSquare size={16} /> },
            { label: 'Organize insights across pages', icon: <NotebookPen size={16} /> },
            { label: 'Bookmark page, text, image, words', icon: <Bookmark size={16} /> },
            { label: 'Team collaboration', icon: <Users size={16} /> },
          ].map((item) => (
            <div key={item.label} className={styles.extensionPromoFeature}>
              <div className={styles.extensionPromoFeatureIcon}>{item.icon}</div>
              <p className={styles.extensionPromoFeatureLabel}>{item.label}</p>
            </div>
          ))}
          <a
            href="https://chromewebstore.google.com/detail/xplaino/nmphalmbdmddagbllhjnfnmodfmbnlkp"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.extensionPromoButton}
          >
            Try Extension — It's Free
            <ArrowRight size={14} />
          </a>
        </div>
      </div>

      </div>{/* end mainRow */}

      </div>{/* end outerRow */}

      {/* View all PDFs modal */}
      {viewAllOpen && (
        <div className={styles.viewAllOverlay} onClick={() => setViewAllOpen(false)}>
          <div className={styles.viewAllModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.viewAllModalHeader}>
              <p className={styles.viewAllModalTitle}>Your PDFs</p>
              <button className={styles.viewAllModalClose} onClick={() => setViewAllOpen(false)}>✕</button>
            </div>
            <ul className={styles.viewAllList}>
              {unauthPdfs.map((pdf) => (
                <li
                  key={pdf.id}
                  className={styles.viewAllItem}
                  onClick={() => window.open(`/pdf/${pdf.id}`, '_blank')}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') window.open(`/pdf/${pdf.id}`, '_blank'); }}
                >
                  <FileText size={15} className={styles.viewAllItemIcon} />
                  <span className={styles.viewAllItemName}>{pdf.file_name}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

ToolsPdfPage.displayName = 'ToolsPdfPage';
