import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiUploadCloud,
  FiFileText,
  FiLink,
  FiCheck,
  FiAlertCircle,
  FiRefreshCw,
  FiArrowRight,
  FiInfo,
  FiBookOpen,
  FiMessageCircle,
  FiBookmark,
  FiLayers,
  FiFolder,
} from 'react-icons/fi';
import { SiGoogledrive, SiDropbox } from 'react-icons/si';
import { useAuth } from '@/shared/hooks/useAuth';
import styles from './ToolsPdfPage.module.css';

type Tab = 'local' | 'drive' | 'dropbox';
type PageState = 'idle' | 'processing' | 'success';

interface UploadedFile {
  name: string;
  size: number;
  source: 'local' | 'drive' | 'dropbox';
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
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<Tab>('local');
  const [pageState, setPageState] = useState<PageState>('idle');
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);

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

  // Processing message cycling
  const [processingMsg, setProcessingMsg] = useState('Reading your PDF…');
  const processingMessages = [
    'Reading your PDF…',
    'Checking file integrity…',
    'Almost there…',
  ];

  // Simulate processing then success
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
  }, []);

  const handleFile = useCallback(
    (file: File) => {
      setLocalError(null);
      if (!isPdfFile(file)) {
        setLocalError('Only PDF files are accepted. Please select a .pdf file.');
        return;
      }
      simulateProcess({ name: file.name, size: file.size, source: 'local' });
    },
    [simulateProcess]
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

  const handleDriveSubmit = () => {
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
    const fileName = url.split('/').filter(Boolean).pop() || 'document.pdf';
    simulateProcess({ name: fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`, size: 0, source: 'drive' });
  };

  const handleDropboxSubmit = () => {
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
      navigate('/user/dashboard/pdf');
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
    local: <FiUploadCloud size={13} />,
    drive: <SiGoogledrive size={13} />,
    dropbox: <SiDropbox size={13} />,
  };

  return (
    <div className={styles.page}>
      {/* Full-viewport drag overlay */}
      {isDraggingOverViewport && pageState === 'idle' && (
        <div className={styles.dragOverlay}>
          <div className={styles.dragOverlayInner}>
            <FiUploadCloud className={styles.dragOverlayIcon} size={56} />
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

      {/* Two-column layout: feature list + upload card */}
      <div className={styles.mainRow}>

      {/* Feature list — left column */}
      <div className={styles.featuresColumn}>
        <p className={styles.featuresHeading}>What you can do</p>
        {[
          {
            label: 'Summarise PDF',
            icon: <FiFileText size={22} />,
          },
          {
            label: 'Get citations for every answer',
            icon: <FiBookOpen size={22} />,
          },
          {
            label: 'Ask anything about your PDF',
            icon: <FiMessageCircle size={22} />,
          },
          {
            label: 'Highlight & bookmark content',
            icon: <FiBookmark size={22} />,
          },
          {
            label: 'Conversations saved on the PDF',
            icon: <FiLayers size={22} />,
          },
          {
            label: 'Save to dashboard & chat later',
            icon: <FiFolder size={22} />,
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
            <FiArrowRight size={14} />
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
              <FiUploadCloud className={styles.tabIcon} size={15} />
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
                <FiCheck size={28} strokeWidth={2.5} />
              </div>
              <p className={styles.successTitle}>PDF loaded successfully!</p>
              <div className={styles.fileInfoCard}>
                <div className={styles.fileInfoIcon}>
                  <FiFileText size={24} />
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
                <FiRefreshCw size={13} />
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
                  <FiUploadCloud size={28} />
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
                  <FiFileText size={15} />
                  Browse file
                </button>
                <p className={styles.dropZoneHint}>
                  <FiInfo size={12} />
                  PDF files only
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
                  <FiAlertCircle size={15} />
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
                  <FiLink size={14} />
                  Load
                </button>
              </div>
              {linkError && (
                <div className={styles.linkError}>
                  <FiAlertCircle size={14} />
                  {linkError}
                </div>
              )}
              <div className={styles.linkHint}>
                <FiInfo className={styles.linkHintIcon} size={14} />
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
                  <FiLink size={14} />
                  Load
                </button>
              </div>
              {linkError && (
                <div className={styles.linkError}>
                  <FiAlertCircle size={14} />
                  {linkError}
                </div>
              )}
              <div className={styles.linkHint}>
                <FiInfo className={styles.linkHintIcon} size={14} />
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
    </div>
  );
};

ToolsPdfPage.displayName = 'ToolsPdfPage';
