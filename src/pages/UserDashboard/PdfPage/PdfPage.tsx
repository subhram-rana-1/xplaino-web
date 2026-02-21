import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiRefreshCw, FiPlus, FiCheck } from 'react-icons/fi';
import styles from './PdfPage.module.css';
import { useAuth } from '@/shared/hooks/useAuth';
import { getAllPdfs, createPdf, getPresignedUploadUrl, getDownloadUrl, deletePdf } from '@/shared/services/pdf.service';
import type { PdfResponse } from '@/shared/types/pdf.types';
import { Toast } from '@/shared/components/Toast';
import { ProcessingModal } from '@/shared/components/ProcessingModal';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { DataTable, type Column } from '@/shared/components/DataTable';
import { PdfActionIcons } from './components/PdfActionIcons';

/**
 * PdfPage - PDF management page
 * Rendered inside UserDashboardLayout via Outlet
 * 
 * @returns JSX element
 */
export const PdfPage: React.FC = () => {
  const { accessToken } = useAuth();
  const navigate = useNavigate();
  const [pdfs, setPdfs] = useState<PdfResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type?: 'success' | 'error' } | null>(null);
  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null);
  const [deleteConfirmPdfId, setDeleteConfirmPdfId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showFetchSuccess, setShowFetchSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchPdfs = async () => {
    if (!accessToken) return;

    try {
      setIsLoading(true);
      const response = await getAllPdfs(accessToken);
      setPdfs(response.pdfs);
      
      // Show success feedback for 1 second
      setShowFetchSuccess(true);
      setTimeout(() => {
        setShowFetchSuccess(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching PDFs:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load PDFs';
      setToast({ message: errorMessage, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (accessToken) {
      fetchPdfs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  const handleRefresh = () => {
    fetchPdfs();
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !accessToken) {
      return;
    }

    // Validate file size (5MB limit)
    const maxFileSizeBytes = 5 * 1024 * 1024; // 5MB
    if (file.size > maxFileSizeBytes) {
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      setToast({ 
        message: `File size ${fileSizeMB}MB exceeds maximum allowed size of 5MB`, 
        type: 'error' 
      });
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    // Validate file type
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setToast({ 
        message: 'Only PDF files are allowed', 
        type: 'error' 
      });
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    try {
      setIsUploading(true);

      // 1. Create PDF record (metadata only)
      const newPdf = await createPdf(accessToken, { file_name: file.name });

      // 2. Get presigned upload URL (response includes content_type to use for PUT)
      const { upload_url, content_type } = await getPresignedUploadUrl(accessToken, {
        file_name: file.name,
        file_type: 'PDF',
        entity_type: 'PDF',
        entity_id: newPdf.id,
      });

      // 3. PUT file to S3 using the same Content-Type the backend used when signing
      const putResponse = await fetch(upload_url, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': content_type,
        },
      });

      if (!putResponse.ok) {
        throw new Error(`Upload failed with status ${putResponse.status}`);
      }

      // 4. Add to list and navigate to PDF viewer
      setPdfs((prevPdfs) => [{ ...newPdf, file_uploads: [] }, ...prevPdfs]);
      setToast({ message: 'PDF uploaded successfully!', type: 'success' });
      navigate(`/pdf/${newPdf.id}`);
    } catch (error) {
      console.error('Error uploading PDF:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload PDF';
      setToast({ message: errorMessage, type: 'error' });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  const handleDelete = (pdfId: string) => {
    setDeleteConfirmPdfId(pdfId);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmPdfId || !accessToken) return;

    try {
      setIsDeleting(true);
      await deletePdf(accessToken, deleteConfirmPdfId);
      
      // Remove PDF from state
      setPdfs(prevPdfs => prevPdfs.filter(pdf => pdf.id !== deleteConfirmPdfId));
      setToast({ message: 'PDF deleted successfully', type: 'success' });
      setDeleteConfirmPdfId(null);
    } catch (error) {
      console.error('Error deleting PDF:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete PDF';
      setToast({ message: errorMessage, type: 'error' });
      setDeleteConfirmPdfId(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBook = (pdfId: string) => {
    const url = `${window.location.origin}/pdf/${pdfId}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleDownload = async (pdf: PdfResponse) => {
    const fileUploads = pdf.file_uploads ?? [];
    if (fileUploads.length === 0) {
      setToast({ message: 'No file to download', type: 'error' });
      return;
    }
    if (!accessToken) return;
    const fileUploadId = fileUploads[0].id;
    try {
      const { download_url } = await getDownloadUrl(accessToken, fileUploadId);
      const link = document.createElement('a');
      link.href = download_url;
      link.download = pdf.file_name || 'document.pdf';
      link.rel = 'noopener noreferrer';
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error getting download URL:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to get download link';
      setToast({ message: errorMessage, type: 'error' });
    }
  };

  const columns: Column<PdfResponse>[] = [
    {
      key: 'file_name',
      header: 'File Name',
      align: 'left',
      render: (pdf) => (
        <span className={styles.fileName}>{pdf.file_name}</span>
      ),
    },
    {
      key: 'created_at',
      header: 'Created At',
      align: 'left',
      render: (pdf) => formatDate(pdf.created_at),
    },
    {
      key: 'updated_at',
      header: 'Updated At',
      align: 'left',
      render: (pdf) => formatDate(pdf.updated_at),
    },
    {
      key: 'actions',
      header: 'ASK AI',
      align: 'left',
      render: (pdf) => {
        const isHovered = hoveredRowId === pdf.id;
        const canDownload = (pdf.file_uploads?.length ?? 0) > 0;
        return (
          <PdfActionIcons
            onDelete={() => handleDelete(pdf.id)}
            onBook={() => handleBook(pdf.id)}
            onDownload={() => handleDownload(pdf)}
            isVisible={isHovered}
            canDownload={canDownload}
            className={styles.actionIconsInCell}
          />
        );
      },
    },
  ];

  return (
    <div className={styles.pdfPage}>
      <div className={styles.container}>
        <h2 className={styles.heading}>PDFs</h2>
        <div className={styles.header}>
          <div className={styles.headerRight}>
            <button
              className={`${styles.refreshButton} ${showFetchSuccess ? styles.refreshButtonSuccess : ''}`}
              onClick={handleRefresh}
              disabled={isLoading}
              title="Refresh PDFs"
            >
              {showFetchSuccess ? (
                <>
                  <FiCheck />
                  <span>Pdfs fetched</span>
                </>
              ) : (
                <>
                  <FiRefreshCw className={isLoading ? styles.spin : ''} />
                  <span>Fetch pdfs</span>
                </>
              )}
            </button>
            <button
              className={styles.uploadButton}
              onClick={handleUploadClick}
              disabled={isUploading}
              title="Upload PDF"
            >
              <FiPlus />
              <span>Upload PDF</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleFileChange}
              className={styles.fileInput}
              disabled={isUploading}
            />
          </div>
        </div>

        {isLoading && pdfs.length === 0 ? (
          <div className={styles.loading}>Loading PDFs...</div>
        ) : pdfs.length === 0 ? (
          <div className={styles.emptyState}>
            <h2 className={styles.emptyHeading}>No PDFs yet</h2>
            <p className={styles.emptyMessage}>You haven't uploaded any PDFs yet.</p>
          </div>
        ) : (
          <div className={styles.listView}>
            <DataTable
              columns={columns}
              data={pdfs}
              emptyMessage="No PDFs found"
              rowKey={(pdf) => pdf.id}
              onRowHover={(pdf) => {
                if (pdf) {
                  setHoveredRowId(pdf.id);
                } else {
                  setHoveredRowId(null);
                }
              }}
            />
          </div>
        )}

        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}

        <ProcessingModal
          isOpen={isUploading}
          message="Processing PDF..."
        />

        {deleteConfirmPdfId && (
          <ConfirmDialog
            isOpen={true}
            title="Delete PDF"
            message="Are you sure you want to delete this PDF? This action cannot be undone."
            confirmText={isDeleting ? 'Deleting...' : 'Delete'}
            cancelText="Cancel"
            onConfirm={handleDeleteConfirm}
            onCancel={() => setDeleteConfirmPdfId(null)}
          />
        )}
      </div>
    </div>
  );
};

PdfPage.displayName = 'PdfPage';
