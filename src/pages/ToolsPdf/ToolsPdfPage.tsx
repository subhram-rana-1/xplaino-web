import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { CloudUpload, FileText, Link, Check, AlertCircle, RefreshCw, ArrowRight, Info, BookOpen, MessageCircle, Bookmark, Layers, Folder } from 'lucide-react';
import { SiGoogledrive, SiDropbox } from 'react-icons/si';
import { useAuth } from '@/shared/hooks/useAuth';
import { fetchPublic, fetchWithAuth } from '@/shared/services/api-client';
import { getUnauthenticatedUserId } from '@/shared/services/auth.service';
import { authConfig } from '@/config/auth.config';
import styles from './ToolsPdfPage.module.css';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

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

function isValidDriveUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.hostname === 'drive.google.com';
  } catch {
    return false;
  }
}

function isValidDropboxUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      parsed.hostname === 'www.dropbox.com' ||
      parsed.hostname === 'dropbox.com' ||
      parsed.hostname === 'dl.dropboxusercontent.com'
    );
  } catch {
    return false;
  }
}

export const ToolsPdfPage: React.FC = () => {
  const { isLoggedIn, isLoading } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<Tab>('local');
  const [pageState, setPageState] = useState<PageState>('idle');
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Local upload state
  const [isDropZoneHovered, setIsDropZoneHovered] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Link input state
  const [driveUrl, setDriveUrl] = useState('');
  const [dropboxUrl, setDropboxUrl] = useState('');
  const [linkError, setLinkError] = useState<string | null>(null);

  // Full-viewport drag overlay
  const [isDraggingOverViewport, setIsDraggingOverViewport] = useState(false);
  const dragCounterRef = useRef(0);

  // Prior PDFs for unauthenticated users
  const [unauthPdfs, setUnauthPdfs] = useState<UnauthPdf[]>([]);
  const [unauthPdfsLoading, setUnauthPdfsLoading] = useState(false);

  // Processing message cycling
  const [processingMsg, setProcessingMsg] = useState('Uploading to secure storage…');
  const processingMessages = [
    'Uploading to secure storage…',
    'Creating PDF record…',
    'Finalising…',
  ];

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

  // Mock flow for Drive / Dropbox (no S3 integration yet)
  const simulateProcess = useCallback((file: UploadedFile) => {
    setPageState('processing');
    setProcessingMsg(processingMessages[0]);

    let idx = 0;
    const interval = setInterval(() => {
      idx = (idx + 1) % processingMessages.length;
      setProcessingMsg(processingMessages[idx]);
    }, 900);

    setTimeout(() => {
      clearInterval(interval);
      setUploadedFile(file);
      setPageState('success');
    }, 2400);
  }, [processingMessages]);

  const handleFile = useCallback(
    (file: File) => {
      setLocalError(null);
      if (!isPdfFile(file)) {
        setLocalError('Only PDF files are accepted. Please select a .pdf file.');
        return;
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        setLocalError('File is too large. Maximum allowed size is 5 MB.');
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

  const checkUrlFileSize = async (url: string): Promise<boolean> => {
    try {
      const res = await fetch(url, { method: 'HEAD', mode: 'cors' });
      const contentLength = res.headers.get('Content-Length');
      if (contentLength && parseInt(contentLength, 10) > MAX_FILE_SIZE_BYTES) {
        return false; // too large
      }
    } catch {
      // CORS or network error — can't verify, allow through
    }
    return true;
  };

  const handleDriveSubmit = async () => {
    setLinkError(null);
    const url = driveUrl.trim();
    if (!url) {
      setLinkError('Please enter a Google Drive share link.');
      return;
    }
    if (!isValidDriveUrl(url)) {
      setLinkError('Invalid Google Drive URL. Make sure the link is from drive.google.com.');
      return;
    }
    const sizeOk = await checkUrlFileSize(url);
    if (!sizeOk) {
      setLinkError('This file appears to be larger than 5 MB and cannot be loaded.');
      return;
    }
    const fileName = url.split('/').filter(Boolean).pop() || 'document.pdf';
    simulateProcess({ name: fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`, size: 0, source: 'drive' });
  };

  const handleDropboxSubmit = async () => {
    setLinkError(null);
    const url = dropboxUrl.trim();
    if (!url) {
      setLinkError('Please enter a Dropbox share link.');
      return;
    }
    if (!isValidDropboxUrl(url)) {
      setLinkError('Invalid Dropbox URL. Make sure the link is from dropbox.com.');
      return;
    }
    const sizeOk = await checkUrlFileSize(url);
    if (!sizeOk) {
      setLinkError('This file appears to be larger than 5 MB and cannot be loaded.');
      return;
    }
    const pathParts = new URL(url).pathname.split('/').filter(Boolean);
    const fileName = pathParts[pathParts.length - 1] || 'document';
    simulateProcess({
      name: fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`,
      size: 0,
      source: 'dropbox',
    });
  };

  const handleReset = () => {
    setPageState('idle');
    setUploadedFile(null);
    setLocalError(null);
    setLinkError(null);
    setDriveUrl('');
    setDropboxUrl('');
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

      {/* Hero */}
      <div className={styles.hero}>
        <h1 className={styles.heroTitle}>
          Analyze any PDF with{' '}
          <span className={styles.heroTitleAccent}>AI</span>
        </h1>
        <p className={styles.heroSubtitle}>
          Upload a PDF from your device, Google Drive, or Dropbox — and let AI
          break it down for you instantly.
        </p>
      </div>

      {/* Outer row: sidebar (conditional, leftmost) + inner two-column layout */}
      <div className={styles.outerRow}>

      {/* PDF history sidebar — leftmost, outside the features+card container */}
      {!unauthPdfsLoading && unauthPdfs.length > 0 && (
        <div className={styles.pdfSidebar}>
          <p className={styles.pdfSidebarHeading}>Your PDFs</p>
          <ul className={styles.pdfSidebarList}>
            {unauthPdfs.map((pdf) => (
              <li
                key={pdf.id}
                className={styles.pdfSidebarItem}
                onClick={() => navigate(`/pdf/${pdf.id}`)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate(`/pdf/${pdf.id}`); }}
              >
                <FileText className={styles.pdfSidebarItemIcon} size={14} />
                <span className={styles.pdfSidebarItemName}>{pdf.file_name}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Inner row: feature list + upload card */}
      <div className={styles.mainRow}>

      {/* Feature list — left column */}
      <div className={styles.featuresColumn}>
        <p className={styles.featuresHeading}>What you can do</p>
        {[
          {
            label: 'Summarise PDF',
            icon: <FileText size={22} />,
          },
          {
            label: 'Get citations for every answer',
            icon: <BookOpen size={22} />,
          },
          {
            label: 'Ask anything about your PDF',
            icon: <MessageCircle size={22} />,
          },
          {
            label: 'Highlight & bookmark content',
            icon: <Bookmark size={22} />,
          },
          {
            label: 'Conversations saved on the PDF',
            icon: <Layers size={22} />,
          },
          {
            label: 'Save to dashboard & chat later',
            icon: <Folder size={22} />,
          },
        ].map((item) => (
          <div key={item.label} className={styles.featureItem}>
            <div className={styles.featureItemIcon}>{item.icon}</div>
            <h2 className={styles.featureItemLabel}>{item.label}</h2>
          </div>
        ))}

        {/* CTA below feature list */}
        <div className={styles.featuresCta}>
          <p className={styles.featuresCtaText}>
            You can do a lot more!
          </p>
          <button className={styles.featuresCtaButton} onClick={handleCtaClick}>
            {isLoggedIn ? 'Go to Dashboard' : 'Sign up free — it\'s free'}
            <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* Card */}
      <div className={styles.card}>
        {/* Tabs */}
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
                  PDF files only · Max 5 MB
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

          {/* Idle — Google Drive tab */}
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

          {/* Idle — Dropbox tab */}
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
        </div>

      </div>


      </div>{/* end mainRow */}

      </div>{/* end outerRow */}
    </div>
  );
};

ToolsPdfPage.displayName = 'ToolsPdfPage';
