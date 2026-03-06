import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, Trash2 } from 'lucide-react';
import styles from './AdminDomains.module.css';
import { getAllDomains, deleteDomain } from '@/shared/services/domain.service';
import type { DomainResponse } from '@/shared/types/domain.types';
import { Toast } from '@/shared/components/Toast';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { CreateDomainModal } from './CreateDomainModal';

const PAGE_SIZE = 20;

interface AdminDomainsProps {
  accessToken: string | null;
}

/**
 * AdminDomains - Admin domain management component
 * 
 * @returns JSX element
 */
export const AdminDomains: React.FC<AdminDomainsProps> = ({ accessToken }) => {
  const navigate = useNavigate();
  const [domains, setDomains] = useState<DomainResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type?: 'success' | 'error' } | null>(null);
  
  // Pagination states
  const [currentOffset, setCurrentOffset] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  
  // Delete confirmation state
  const [domainToDelete, setDomainToDelete] = useState<DomainResponse | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchDomains = async (offset: number = 0) => {
    if (!accessToken) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const response = await getAllDomains(accessToken, offset, PAGE_SIZE);
      setDomains(response.domains);
      setTotalCount(response.total);
      setHasNext(response.has_next);
      setCurrentOffset(offset);
    } catch (error) {
      console.error('Error fetching domains:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load domains';
      setToast({ message: errorMessage, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (accessToken) {
      fetchDomains(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  const handlePrevious = () => {
    const newOffset = Math.max(0, currentOffset - PAGE_SIZE);
    fetchDomains(newOffset);
  };

  const handleNext = () => {
    if (hasNext) {
      fetchDomains(currentOffset + PAGE_SIZE);
    }
  };

  const handleDeleteClick = (domain: DomainResponse, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click navigation
    setDomainToDelete(domain);
  };

  const handleDeleteConfirm = async () => {
    if (!accessToken || !domainToDelete) return;

    setIsDeleting(true);

    try {
      await deleteDomain(accessToken, domainToDelete.id);
      setToast({ message: `Domain "${domainToDelete.url}" deleted successfully`, type: 'success' });
      setDomainToDelete(null);
      // Refresh the current page
      fetchDomains(currentOffset);
    } catch (error) {
      console.error('Error deleting domain:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete domain';
      setToast({ message: errorMessage, type: 'error' });
      setDomainToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.adminDomains}>
        <div className={styles.loading}>Loading domains...</div>
      </div>
    );
  }

  return (
    <div className={styles.adminDomains}>
      <div className={styles.header}>
        <button
          className={styles.refreshButton}
          onClick={() => fetchDomains(currentOffset)}
          disabled={isLoading}
          title="Refresh domains"
        >
          <RefreshCw className={isLoading ? styles.spin : ''} />
        </button>
        <button
          className={styles.addButton}
          onClick={() => setIsModalOpen(true)}
        >
          + Add banned domain
        </button>
      </div>

      {domains.length === 0 ? (
        <div className={styles.emptyState}>
          <h2 className={styles.emptyHeading}>No domains found</h2>
          <p className={styles.emptyMessage}>
            No domains have been added yet.
          </p>
        </div>
      ) : (
        <>
          <div className={styles.domainGrid}>
            {domains.map((domain) => (
              <div
                key={domain.id}
                className={`${styles.domainCard} ${
                  domain.status === 'BANNED' 
                    ? styles.domainCardBanned 
                    : styles.domainCardAllowed
                }`}
                onClick={() => navigate(`/admin/domain/${domain.id}`, { state: { domain } })}
              >
                <button
                  className={styles.deleteButton}
                  onClick={(e) => handleDeleteClick(domain, e)}
                  title="Delete domain"
                  aria-label={`Delete ${domain.url}`}
                >
                  <Trash2 />
                </button>
                <h2 className={styles.cardTitle}>{domain.url}</h2>
              </div>
            ))}
          </div>

          {totalCount > 0 && (
            <div className={styles.pagination}>
              <div className={styles.paginationInfo}>
                Showing {currentOffset + 1}-{Math.min(currentOffset + PAGE_SIZE, totalCount)} of {totalCount} domains
              </div>
              <div className={styles.paginationControls}>
                <button
                  className={styles.paginationButton}
                  onClick={handlePrevious}
                  disabled={currentOffset === 0 || isLoading}
                >
                  Previous
                </button>
                <button
                  className={styles.paginationButton}
                  onClick={handleNext}
                  disabled={!hasNext || isLoading}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Create Domain Modal */}
      <CreateDomainModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          // Refresh domains after successful creation - reset to first page
          fetchDomains(0);
          setToast({ message: 'Domain created successfully', type: 'success' });
        }}
        accessToken={accessToken}
      />

      {/* Delete Confirmation Dialog */}
      {domainToDelete && (
        <ConfirmDialog
          isOpen={!!domainToDelete}
          title="Delete Domain"
          message={
            <>
              Are you sure you want to delete <strong>"{domainToDelete.url}"</strong>? This action cannot be undone.
            </>
          }
          confirmText={isDeleting ? 'Deleting...' : 'Delete'}
          cancelText="Cancel"
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDomainToDelete(null)}
        />
      )}
    </div>
  );
};

AdminDomains.displayName = 'AdminDomains';

