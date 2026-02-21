import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import styles from './PdfDetail.module.css';
import { useAuth } from '@/shared/hooks/useAuth';
import { getAllPdfs, getDownloadUrl } from '@/shared/services/pdf.service';
import type { PdfResponse } from '@/shared/types/pdf.types';
import { Toast } from '@/shared/components/Toast';

// PDF.js worker: use same version as react-pdf's pdfjs-dist (5.4.296)
pdfjs.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@5.4.296/build/pdf.worker.min.mjs';

type ViewState = 'loading' | 'not_found' | 'no_file' | 'ready' | 'error';

/**
 * PdfDetail - PDF viewer page using react-pdf
 * Loads PDF via download URL (getDownloadUrl) and renders with text layer for selection.
 */
export const PdfDetail: React.FC = () => {
  const { pdfId } = useParams<{ pdfId: string }>();
  const { accessToken } = useAuth();
  const [pdfDetails, setPdfDetails] = useState<PdfResponse | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [viewState, setViewState] = useState<ViewState>('loading');
  const [numPages, setNumPages] = useState<number | null>(null);
  const [toast, setToast] = useState<{ message: string; type?: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (!accessToken || !pdfId) return;

    let cancelled = false;

    const loadPdf = async () => {
      try {
        setViewState('loading');
        const response = await getAllPdfs(accessToken);
        const pdf = response.pdfs.find((p) => p.id === pdfId);

        if (cancelled) return;
        if (!pdf) {
          setViewState('not_found');
          return;
        }

        setPdfDetails(pdf);

        const fileUploads = pdf.file_uploads ?? [];
        if (fileUploads.length === 0) {
          setViewState('no_file');
          return;
        }

        const fileUploadId = fileUploads[0].id;
        const { download_url } = await getDownloadUrl(accessToken, fileUploadId);

        if (cancelled) return;
        setDownloadUrl(download_url);
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
  }, [accessToken, pdfId]);

  const onDocumentLoadSuccess = ({ numPages: n }: { numPages: number }) => {
    setNumPages(n);
  };

  const onDocumentLoadError = (error: Error) => {
    console.error('Document load error:', error);
    setToast({ message: error.message || 'Failed to load PDF document', type: 'error' });
    setViewState('error');
  };

  if (viewState === 'loading') {
    return (
      <div className={styles.wrapper}>
        <div className={styles.container}>
          <div className={styles.loading}>Loading PDF...</div>
        </div>
      </div>
    );
  }

  if (viewState === 'not_found') {
    return (
      <div className={styles.wrapper}>
        <div className={styles.container}>
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
        <div className={styles.container}>
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
        <div className={styles.container}>
          <div className={styles.emptyState}>
            <h2 className={styles.emptyHeading}>Failed to load PDF</h2>
            <p className={styles.emptyMessage}>Something went wrong. Please try again.</p>
          </div>
          {toast && (
            <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.container}>
        {pdfDetails && (
          <h3 className={styles.pdfTitle}>{pdfDetails.file_name}</h3>
        )}

        {numPages !== null && (
          <div className={styles.header}>
            <div className={styles.pageInfo}>{numPages} page{numPages !== 1 ? 's' : ''}</div>
          </div>
        )}

        <div className={styles.content}>
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
                  <Page
                    key={`page-${index + 1}`}
                    pageNumber={index + 1}
                    renderTextLayer={true}
                    renderAnnotationLayer={true}
                    className={styles.page}
                  />
                ))}
            </Document>
          )}
        </div>

        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </div>
    </div>
  );
};

PdfDetail.displayName = 'PdfDetail';
