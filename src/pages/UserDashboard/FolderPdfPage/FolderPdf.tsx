import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { FiArrowLeft, FiRefreshCw, FiPlus, FiCheck } from 'react-icons/fi';
import { useAuth } from '@/shared/hooks/useAuth';
import { getAllPdfs, deletePdf, getDownloadUrl } from '@/shared/services/pdf.service';
import { getAllFolders } from '@/shared/services/folders.service';
import type { PdfResponse } from '@/shared/types/pdf.types';
import type { FolderWithSubFolders } from '@/shared/types/folders.types';
import { Toast } from '@/shared/components/Toast';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { DataTable, type Column } from '@/shared/components/DataTable';
import { FolderSelectorPopover } from '@/shared/components/FolderSelectorPopover';
import { PdfActionIcons } from '../PdfPage/components/PdfActionIcons';
import { PdfUploadModal } from '@/shared/components/PdfUploadModal';
import styles from './FolderPdf.module.css';

/**
 * FolderPdf - PDF folder detail page.
 * Shows PDFs within a specific PDF folder.
 */
export const FolderPdf: React.FC = () => {
  const { folderId } = useParams<{ folderId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { accessToken } = useAuth();

  const nameFromState: string = (location.state as { folder?: { name?: string } } | null)?.folder?.name ?? '';
  const [resolvedFolderName, setResolvedFolderName] = useState<string>(nameFromState);

  useEffect(() => {
    if (nameFromState || !folderId || !accessToken) return;
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
        const name = findInTree(res.folders, folderId);
        if (name) setResolvedFolderName(name);
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [folderId, accessToken]);

  const folderName = resolvedFolderName;

  const [folders, setFolders] = useState<FolderWithSubFolders[]>([]);

  useEffect(() => {
    if (!accessToken) return;
    getAllFolders(accessToken)
      .then((res) => setFolders(res.folders))
      .catch(() => {});
  }, [accessToken]);

  const [pdfs, setPdfs] = useState<PdfResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type?: 'success' | 'error' } | null>(null);
  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null);
  const [deleteConfirmPdfId, setDeleteConfirmPdfId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showFetchSuccess, setShowFetchSuccess] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const fetchPdfs = async (showSuccessFeedback = false) => {
    if (!accessToken) return;

    try {
      setIsLoading(true);
      const response = await getAllPdfs(accessToken, folderId);
      setPdfs(response.pdfs);

      if (showSuccessFeedback) {
        setShowFetchSuccess(true);
        setTimeout(() => setShowFetchSuccess(false), 1000);
      }
    } catch (error) {
      console.error('Error fetching PDFs:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load PDFs';
      setToast({ message: errorMessage, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (accessToken) fetchPdfs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, folderId]);

  const handleRefresh = () => fetchPdfs(true);

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

  const handleDelete = (pdfId: string) => setDeleteConfirmPdfId(pdfId);

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmPdfId || !accessToken) return;

    try {
      setIsDeleting(true);
      await deletePdf(accessToken, deleteConfirmPdfId);
      setPdfs((prev) => prev.filter((pdf) => pdf.id !== deleteConfirmPdfId));
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
    const params = new URLSearchParams({ folderName, ...(folderId ? { folderId } : {}) });
    window.open(`${window.location.origin}/pdf/${pdfId}?${params}`, '_blank', 'noopener,noreferrer');
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
      const response = await fetch(download_url);
      if (!response.ok) throw new Error('Failed to fetch file');
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = pdf.file_name || 'document.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to download file';
      setToast({ message: errorMessage, type: 'error' });
    }
  };

  const columns: Column<PdfResponse>[] = [
    {
      key: 'file_name',
      header: 'File Name',
      align: 'left',
      render: (pdf) => <span className={styles.fileName}>{pdf.file_name}</span>,
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
      header: 'CHAT PDF',
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
    <div className={styles.container}>
      {/* Breadcrumb */}
      <div className={styles.breadcrumb}>
        <button className={styles.backButton} onClick={() => navigate('/user/dashboard')}>
          <FiArrowLeft size={16} />
          <span>Dashboard</span>
        </button>
        <FolderSelectorPopover
          folders={folders}
          currentFolderId={folderId}
          onSelect={(folder) => navigate(`/user/dashboard/folder/${folder.id}/pdf`, { state: { folderName: folder.name } })}
        />
      </div>

      <h2 className={styles.heading}>{folderName}</h2>

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
                <span>PDFs fetched</span>
              </>
            ) : (
              <>
                <FiRefreshCw className={isLoading ? styles.spin : ''} />
                <span>Fetch PDFs</span>
              </>
            )}
          </button>
          <button
            className={styles.uploadButton}
            onClick={() => setIsUploadModalOpen(true)}
            title="New PDF"
          >
            <FiPlus />
            <span>New PDF</span>
          </button>
        </div>
      </div>

      {isLoading && pdfs.length === 0 ? (
        <div className={styles.loading}>Loading PDFs...</div>
      ) : pdfs.length === 0 ? (
        <div className={styles.emptyState}>
          <h2 className={styles.emptyHeading}>No PDFs yet</h2>
          <p className={styles.emptyMessage}>Upload a PDF to get started.</p>
        </div>
      ) : (
        <div className={styles.listView}>
          <DataTable
            columns={columns}
            data={pdfs}
            emptyMessage="No PDFs found"
            rowKey={(pdf) => pdf.id}
            onRowHover={(pdf) => {
              if (pdf) setHoveredRowId(pdf.id);
              else setHoveredRowId(null);
            }}
            onRowClick={(pdf) => handleBook(pdf.id)}
          />
        </div>
      )}

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}

      <PdfUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        folderId={folderId}
        folderName={folderName}
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
  );
};

FolderPdf.displayName = 'FolderPdf';
