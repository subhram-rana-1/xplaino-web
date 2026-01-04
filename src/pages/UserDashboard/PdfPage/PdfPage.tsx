import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiRefreshCw, FiPlus } from 'react-icons/fi';
import styles from './PdfPage.module.css';
import { useAuth } from '@/shared/hooks/useAuth';
import { getAllPdfs, convertPdfToHtml, deletePdf } from '@/shared/services/pdf.service';
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchPdfs = async () => {
    if (!accessToken) return;

    try {
      setIsLoading(true);
      const response = await getAllPdfs(accessToken);
      setPdfs(response.pdfs);
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
      const newPdf = await convertPdfToHtml(accessToken, file);
      
      // Add new PDF to the beginning of the list
      setPdfs(prevPdfs => [newPdf, ...prevPdfs]);
      setToast({ message: 'PDF uploaded and converted successfully!', type: 'success' });
    } catch (error) {
      console.error('Error uploading PDF:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload PDF';
      setToast({ message: errorMessage, type: 'error' });
    } finally {
      setIsUploading(false);
      // Reset file input
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
    navigate(`/pdf/${pdfId}`);
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
      header: '',
      align: 'right',
      render: (pdf) => {
        const isHovered = hoveredRowId === pdf.id;
        return (
          <PdfActionIcons
            onDelete={() => handleDelete(pdf.id)}
            onBook={() => handleBook(pdf.id)}
            isVisible={isHovered}
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
              className={styles.refreshButton}
              onClick={handleRefresh}
              disabled={isLoading}
              title="Refresh PDFs"
            >
              <FiRefreshCw className={isLoading ? styles.spin : ''} />
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
