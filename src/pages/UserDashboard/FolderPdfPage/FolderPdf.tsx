import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, RefreshCw, Plus, Check } from 'lucide-react';
import { useAuth } from '@/shared/hooks/useAuth';
import { getAllPdfs, deletePdf, getDownloadUrl, sharePdf, unsharePdf, getPdfShareeList, makePdfPublic, makePdfPrivate } from '@/shared/services/pdf.service';
import { getAllFolders } from '@/shared/services/folders.service';
import type { PdfResponse } from '@/shared/types/pdf.types';
import type { FolderWithSubFolders, ShareeItem } from '@/shared/types/folders.types';
import { Toast } from '@/shared/components/Toast';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { DataTable, type Column } from '@/shared/components/DataTable';
import { FolderSelectorPopover } from '@/shared/components/FolderSelectorPopover';
import { PdfActionIcons } from '../PdfPage/components/PdfActionIcons';
import { PdfUploadModal } from '@/shared/components/PdfUploadModal';
import { PdfShareModal } from '@/shared/components/PdfShareModal';
import { ShareeListModal } from '@/shared/components/ShareeListModal';
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

  const locationState = location.state as { folder?: { name?: string }; autoOpenUpload?: boolean } | null;
  const nameFromState: string = locationState?.folder?.name ?? '';
  const autoOpenUpload = locationState?.autoOpenUpload ?? false;
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

  // Auto-open the upload modal when navigated from /tools/pdf
  useEffect(() => {
    if (autoOpenUpload) {
      setIsUploadModalOpen(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Share PDF state — track the full PDF object so we have access_level
  const [sharePdfEntry, setSharePdfEntry] = useState<PdfResponse | null>(null);

  // Manage PDF sharing state
  const [manageSharingPdfId, setManageSharingPdfId] = useState<string | null>(null);
  const [manageSharingPdfName, setManageSharingPdfName] = useState<string>('');
  const [pdfShareeList, setPdfShareeList] = useState<ShareeItem[]>([]);
  const [isPdfShareeListLoading, setIsPdfShareeListLoading] = useState(false);

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

  const handleSharePdfClick = async (pdf: PdfResponse) => {
    setSharePdfEntry(pdf);
    // Load sharees in the background so the inline section is populated
    if (!accessToken) return;
    setIsPdfShareeListLoading(true);
    try {
      const res = await getPdfShareeList(accessToken, pdf.id);
      setPdfShareeList(res.sharees);
    } catch {
      setPdfShareeList([]);
    } finally {
      setIsPdfShareeListLoading(false);
    }
  };

  const handleSharePdfSubmit = async (email: string) => {
    if (!accessToken || !sharePdfEntry) return;
    await sharePdf(accessToken, sharePdfEntry.id, email);
  };

  const handleMakePdfPublic = async () => {
    if (!accessToken || !sharePdfEntry) throw new Error('Not authenticated');
    const updated = await makePdfPublic(accessToken, sharePdfEntry.id);
    setPdfs((prev) =>
      prev.map((p) => (p.id === updated.id ? { ...p, access_level: updated.access_level } : p))
    );
    setSharePdfEntry((prev) => (prev ? { ...prev, access_level: updated.access_level } : prev));
    return updated;
  };

  const handleMakePdfPrivate = async () => {
    if (!accessToken || !sharePdfEntry) throw new Error('Not authenticated');
    const updated = await makePdfPrivate(accessToken, sharePdfEntry.id);
    setPdfs((prev) =>
      prev.map((p) => (p.id === updated.id ? { ...p, access_level: updated.access_level } : p))
    );
    setSharePdfEntry((prev) => (prev ? { ...prev, access_level: updated.access_level } : prev));
    return updated;
  };

  const handleManagePdfSharingClick = async (pdf: PdfResponse) => {
    if (!accessToken) return;
    setManageSharingPdfId(pdf.id);
    setManageSharingPdfName(pdf.file_name);
    setIsPdfShareeListLoading(true);
    try {
      const res = await getPdfShareeList(accessToken, pdf.id);
      setPdfShareeList(res.sharees);
    } catch (error) {
      console.error('Error fetching PDF sharee list:', error);
      setToast({ message: 'Failed to load sharing list', type: 'error' });
      setManageSharingPdfId(null);
    } finally {
      setIsPdfShareeListLoading(false);
    }
  };

  const handleUnsharePdf = async (email: string) => {
    // Works for both the share modal (sharePdfEntry) and manage-sharing modal (manageSharingPdfId)
    const pdfId = manageSharingPdfId || sharePdfEntry?.id;
    if (!accessToken || !pdfId) return;
    await unsharePdf(accessToken, pdfId, email);
    setPdfShareeList(prev => prev.filter(s => s.email !== email));
    setToast({ message: `Removed access for ${email}`, type: 'success' });
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
            onShare={() => handleSharePdfClick(pdf)}
            onManageSharing={() => handleManagePdfSharingClick(pdf)}
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
          <ArrowLeft size={16} />
          <span>Dashboard</span>
        </button>
        <FolderSelectorPopover
          folders={folders}
          currentFolderId={folderId}
          onSelect={(folder) => navigate(`/user/dashboard/folder/${folder.id}/pdf`, { state: { folderName: folder.name } })}
        />
      </div>

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
                <Check />
                <span>PDFs fetched</span>
              </>
            ) : (
              <>
                <RefreshCw className={isLoading ? styles.spin : ''} />
                <span>Fetch PDFs</span>
              </>
            )}
          </button>
          <button
            className={styles.uploadButton}
            onClick={() => setIsUploadModalOpen(true)}
            title="New PDF"
          >
            <Plus />
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

      <PdfShareModal
        isOpen={!!sharePdfEntry}
        onClose={() => { setSharePdfEntry(null); setPdfShareeList([]); }}
        onShare={handleSharePdfSubmit}
        onMakePublic={handleMakePdfPublic}
        onMakePrivate={handleMakePdfPrivate}
        title={`Share "${sharePdfEntry?.file_name ?? ''}"`}
        accessLevel={sharePdfEntry?.access_level ?? 'PRIVATE'}
        pdfId={sharePdfEntry?.id ?? ''}
        isOwner={true}
        sharees={pdfShareeList}
        isLoadingSharees={isPdfShareeListLoading}
        onUnshare={handleUnsharePdf}
      />

      <ShareeListModal
        isOpen={!!manageSharingPdfId}
        onClose={() => { setManageSharingPdfId(null); setManageSharingPdfName(''); setPdfShareeList([]); }}
        title={`Sharing: "${manageSharingPdfName}"`}
        sharees={pdfShareeList}
        isLoading={isPdfShareeListLoading}
        onUnshare={handleUnsharePdf}
      />
    </div>
  );
};

FolderPdf.displayName = 'FolderPdf';
