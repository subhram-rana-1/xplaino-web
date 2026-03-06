import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { CloudUpload, FileText, Link, Check, AlertCircle, RefreshCw, Info, X } from 'lucide-react';
import { SiGoogledrive, SiDropbox } from 'react-icons/si';
import { fetchWithAuth, fetchPublic } from '@/shared/services/api-client';
import { authConfig } from '@/config/auth.config';
import { useAuth } from '@/shared/hooks/useAuth';
import styles from './PdfUploadModal.module.css';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

type Tab = 'local' | 'drive' | 'dropbox';
type UploadState = 'idle' | 'processing' | 'success';

interface UploadedFile {
  name: string;
  size: number;
  source: 'local' | 'drive' | 'dropbox';
}

interface PdfUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  folderId?: string;
  folderName?: string;
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

export const PdfUploadModal: React.FC<PdfUploadModalProps> = ({ isOpen, onClose, folderId, folderName }) => {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();

  const [activeTab, setActiveTab] = useState<Tab>('local');
  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [isDropZoneHovered, setIsDropZoneHovered] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [driveUrl, setDriveUrl] = useState('');
  const [dropboxUrl, setDropboxUrl] = useState('');
  const [linkError, setLinkError] = useState<string | null>(null);

  const [isDraggingOverViewport, setIsDraggingOverViewport] = useState(false);
  const dragCounterRef = useRef(0);

  const [processingMsg, setProcessingMsg] = useState('Uploading to secure storage…');
  const processingMessages = [
    'Uploading to secure storage…',
    'Creating PDF record…',
    'Finalising…',
  ];

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab('local');
      setUploadState('idle');
      setUploadedFile(null);
      setIsUploading(false);
      setIsDropZoneHovered(false);
      setLocalError(null);
      setDriveUrl('');
      setDropboxUrl('');
      setLinkError(null);
      setIsDraggingOverViewport(false);
      dragCounterRef.current = 0;
    }
  }, [isOpen]);

  const uploadLocalFile = useCallback(
    async (file: File) => {
      if (isUploading) return;

      const apiFetch = isLoggedIn ? fetchWithAuth : fetchPublic;

      setIsUploading(true);
      setUploadState('processing');
      setProcessingMsg(processingMessages[0]);

      let msgIdx = 0;
      const interval = setInterval(() => {
        msgIdx = (msgIdx + 1) % processingMessages.length;
        setProcessingMsg(processingMessages[msgIdx]);
      }, 900);

      const stopProcessing = (error?: string) => {
        clearInterval(interval);
        setIsUploading(false);
        if (error) {
          setUploadState('idle');
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
            setUploadState('idle');
            onClose();
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
        const createPdfBody: Record<string, string> = { file_name: file.name };
        if (folderId) createPdfBody.folder_id = folderId;
        const createPdfRes = await apiFetch(
          `${authConfig.catenBaseUrl}/api/pdf/create-pdf`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(createPdfBody),
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
          // Non-fatal — PDF record was created; still navigate
          console.warn('Failed to link file upload to PDF record, continuing.');
        }

        clearInterval(interval);
        setIsUploading(false);
        onClose();
        const params = new URLSearchParams({
          ...(folderId ? { folderId } : {}),
          ...(folderName ? { folderName } : {}),
        });
        navigate(`/pdf/${pdfId}${params.toString() ? `?${params}` : ''}`);
      } catch {
        stopProcessing('Something went wrong. Please try again.');
      }
    },
    [isUploading, isLoggedIn, folderId, navigate, onClose, processingMessages]
  );

  // Mock flow for Drive / Dropbox
  const simulateProcess = useCallback(
    (file: UploadedFile) => {
      setUploadState('processing');
      setProcessingMsg(processingMessages[0]);

      let idx = 0;
      const interval = setInterval(() => {
        idx = (idx + 1) % processingMessages.length;
        setProcessingMsg(processingMessages[idx]);
      }, 900);

      setTimeout(() => {
        clearInterval(interval);
        setUploadedFile(file);
        setUploadState('success');
      }, 2400);
    },
    [processingMessages]
  );

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

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDropZoneDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDropZoneHovered(true);
  };

  const handleDropZoneDragLeave = () => setIsDropZoneHovered(false);

  const handleDropZoneDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDropZoneHovered(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  // Full-viewport drag listeners (only while modal is open)
  useEffect(() => {
    if (!isOpen) return;

    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      dragCounterRef.current += 1;
      if (dragCounterRef.current === 1) setIsDraggingOverViewport(true);
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      dragCounterRef.current -= 1;
      if (dragCounterRef.current <= 0) {
        dragCounterRef.current = 0;
        setIsDraggingOverViewport(false);
      }
    };

    const handleDragOver = (e: DragEvent) => e.preventDefault();

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
  }, [isOpen, handleFile]);

  // Paste listener (only while modal is open)
  useEffect(() => {
    if (!isOpen) return;

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
  }, [isOpen, handleFile]);

  const checkUrlFileSize = async (url: string): Promise<boolean> => {
    try {
      const res = await fetch(url, { method: 'HEAD', mode: 'cors' });
      const contentLength = res.headers.get('Content-Length');
      if (contentLength && parseInt(contentLength, 10) > MAX_FILE_SIZE_BYTES) {
        return false;
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
    simulateProcess({
      name: fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`,
      size: 0,
      source: 'drive',
    });
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
    setUploadState('idle');
    setUploadedFile(null);
    setLocalError(null);
    setLinkError(null);
    setDriveUrl('');
    setDropboxUrl('');
  };

  const handleClose = () => {
    if (!isUploading) onClose();
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

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <>
      {/* Full-viewport drag overlay */}
      {isDraggingOverViewport && uploadState === 'idle' && (
        <div className={styles.dragOverlay}>
          <div className={styles.dragOverlayInner}>
            <CloudUpload className={styles.dragOverlayIcon} size={56} />
            <p className={styles.dragOverlayTitle}>Drop your PDF here</p>
            <p className={styles.dragOverlaySubtitle}>Release to upload</p>
          </div>
        </div>
      )}

      <div className={styles.overlay} onClick={handleClose}>
        <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
          {/* Modal header */}
          <div className={styles.modalHeader}>
            <h2 className={styles.modalTitle}>Upload PDF</h2>
            <button
              type="button"
              className={styles.closeButton}
              onClick={handleClose}
              disabled={isUploading}
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>

          {/* Upload card */}
          <div className={styles.card}>
            {/* Tabs */}
            {uploadState === 'idle' && (
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
              {uploadState === 'idle' && (
                <div className={styles.scannedNotice}>
                  <Info size={13} />
                  Scanned PDFs are not supported. Please upload text-based PDFs only.
                </div>
              )}

              {/* Processing state */}
              {uploadState === 'processing' && (
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
              {uploadState === 'success' && uploadedFile && (
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
              {uploadState === 'idle' && activeTab === 'local' && (
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
              {uploadState === 'idle' && activeTab === 'drive' && (
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
              {uploadState === 'idle' && activeTab === 'dropbox' && (
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
        </div>
      </div>
    </>,
    document.body
  );
};

PdfUploadModal.displayName = 'PdfUploadModal';
