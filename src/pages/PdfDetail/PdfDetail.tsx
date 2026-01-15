import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import styles from './PdfDetail.module.css';
import { useAuth } from '@/shared/hooks/useAuth';
import { getHtmlPagesByPdfId, getAllPdfs } from '@/shared/services/pdf.service';
import type { PdfHtmlPageResponse, PdfResponse } from '@/shared/types/pdf.types';
import { Toast } from '@/shared/components/Toast';

/**
 * PdfDetail - PDF detail page showing HTML pages
 * Displays PDF pages as HTML with infinite scroll
 * 
 * @returns JSX element
 */
export const PdfDetail: React.FC = () => {
  const { pdfId } = useParams<{ pdfId: string }>();
  const { accessToken } = useAuth();
  const [pdfDetails, setPdfDetails] = useState<PdfResponse | null>(null);
  const [pages, setPages] = useState<PdfHtmlPageResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasNext, setHasNext] = useState(false);
  const [toast, setToast] = useState<{ message: string; type?: 'success' | 'error' } | null>(null);
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreTriggerRef = useRef<HTMLDivElement>(null);
  const limit = 20;

  // Fetch PDF details from the list of all PDFs
  useEffect(() => {
    if (!accessToken || !pdfId) return;

    const fetchPdfDetails = async () => {
      try {
        const response = await getAllPdfs(accessToken);
        const pdf = response.pdfs.find(p => p.id === pdfId);
        if (pdf) {
          setPdfDetails(pdf);
        }
      } catch (error) {
        console.error('Error fetching PDF details:', error);
        // Don't show error toast for PDF details - it's not critical
      }
    };

    fetchPdfDetails();
  }, [accessToken, pdfId]);

  // Initial load
  useEffect(() => {
    if (!accessToken || !pdfId) return;

    const fetchInitialPages = async () => {
      try {
        setIsLoading(true);
        const response = await getHtmlPagesByPdfId(accessToken, pdfId, 0, limit);
        setPages(response.pages);
        setHasNext(response.has_next);
        setTotal(response.total);
        setOffset(response.pages.length);
      } catch (error) {
        console.error('Error fetching PDF pages:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to load PDF pages';
        setToast({ message: errorMessage, type: 'error' });
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialPages();
  }, [accessToken, pdfId]);

  // Load more pages
  const loadMorePages = useCallback(async () => {
    if (!accessToken || !pdfId || isLoadingMore || !hasNext) return;

    try {
      setIsLoadingMore(true);
      const response = await getHtmlPagesByPdfId(accessToken, pdfId, offset, limit);
      setPages(prevPages => [...prevPages, ...response.pages]);
      setHasNext(response.has_next);
      setOffset(prevOffset => prevOffset + response.pages.length);
    } catch (error) {
      console.error('Error loading more PDF pages:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load more pages';
      setToast({ message: errorMessage, type: 'error' });
    } finally {
      setIsLoadingMore(false);
    }
  }, [accessToken, pdfId, offset, limit, hasNext, isLoadingMore]);

  // Set up intersection observer for infinite scroll
  useEffect(() => {
    if (!loadMoreTriggerRef.current || !hasNext || isLoadingMore) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNext && !isLoadingMore) {
          loadMorePages();
        }
      },
      {
        root: null,
        rootMargin: '100px',
        threshold: 0.1,
      }
    );

    observerRef.current.observe(loadMoreTriggerRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasNext, isLoadingMore, loadMorePages]);

  // Render HTML content safely
  const renderHtmlContent = (htmlContent: string, pageNo: number) => {
    return (
      <div key={`page-${pageNo}`} className={styles.pageWrapper}>
        <div className={styles.pageNumber}>Page {pageNo}</div>
        <div
          className={styles.pageContainer}
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
      </div>
    );
  };


  if (isLoading && pages.length === 0) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.container}>
          <div className={styles.loading}>Loading PDF...</div>
        </div>
      </div>
    );
  }

  if (pages.length === 0 && !isLoading) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.container}>
          <div className={styles.emptyState}>
            <h2 className={styles.emptyHeading}>No pages found</h2>
            <p className={styles.emptyMessage}>This PDF doesn't have any pages yet.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.container} ref={containerRef}>
        {pdfDetails && (
          <h3 className={styles.pdfTitle}>{pdfDetails.file_name}</h3>
        )}
        
        <div className={styles.header}>
          {total > 0 && (
            <div className={styles.pageInfo}>
              Showing {pages.length} of {total} pages
            </div>
          )}
        </div>

        <div className={styles.content}>
          {pages.map((page) => renderHtmlContent(page.html_content, page.page_no))}
          
          {/* Load more trigger */}
          {hasNext && (
            <div ref={loadMoreTriggerRef} className={styles.loadMoreTrigger}>
              {isLoadingMore && (
                <div className={styles.loadingMore}>Loading more pages...</div>
              )}
            </div>
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

