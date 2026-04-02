import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './AdminExtensionUninstallFeedback.module.css';
import { getAllExtensionUninstallFeedbacks } from '@/shared/services/extensionUninstallFeedback.service';
import type {
  ExtensionUninstallFeedbackItem,
  GetAllExtensionUninstallFeedbacksFilters,
} from '@/shared/types/extensionUninstallFeedback.types';
import { ExtensionUninstallationReason } from '@/shared/types/extensionUninstallFeedback.types';
import { Toast } from '@/shared/components/Toast';
import { DropdownIcon } from '@/shared/components/DropdownIcon';

type ReasonFilter = '' | ExtensionUninstallationReason;

const PAGE_SIZE = 20;

const REASON_LABELS: Record<ExtensionUninstallationReason, string> = {
  [ExtensionUninstallationReason.TOO_EXPENSIVE]: 'Too Expensive',
  [ExtensionUninstallationReason.NOT_USING]: 'Not Using',
  [ExtensionUninstallationReason.FOUND_ALTERNATIVE]: 'Found Alternative',
  [ExtensionUninstallationReason.MISSING_FEATURES]: 'Missing Features',
  [ExtensionUninstallationReason.EXTENSION_NOT_WORKING]: 'Extension Not Working',
  [ExtensionUninstallationReason.OTHER]: 'Other',
};

interface AdminExtensionUninstallFeedbackProps {
  accessToken: string | null;
}

/**
 * AdminExtensionUninstallFeedback - Admin uninstall feedback management component
 *
 * @returns JSX element
 */
export const AdminExtensionUninstallFeedback: React.FC<
  AdminExtensionUninstallFeedbackProps
> = ({ accessToken }) => {
  const [feedbacks, setFeedbacks] = useState<ExtensionUninstallFeedbackItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);

  // Pagination states
  const [currentOffset, setCurrentOffset] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [hasNext, setHasNext] = useState(false);

  // Filter states
  const [reasonFilter, setReasonFilter] = useState<ReasonFilter>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Dropdown state
  const [isReasonDropdownOpen, setIsReasonDropdownOpen] = useState(false);

  const [toast, setToast] = useState<{ message: string; type?: 'success' | 'error' } | null>(null);

  const fetchFeedbacks = async (offset: number) => {
    if (!accessToken) {
      setToast({ message: 'Authentication required', type: 'error' });
      return;
    }

    try {
      setIsLoading(true);

      const filters: GetAllExtensionUninstallFeedbacksFilters = {
        offset,
        limit: PAGE_SIZE,
      };
      if (reasonFilter) {
        filters.reason = reasonFilter;
      }
      if (dateFrom) {
        filters.created_at_from = `${dateFrom}T00:00:00Z`;
      }
      if (dateTo) {
        filters.created_at_to = `${dateTo}T23:59:59Z`;
      }

      const response = await getAllExtensionUninstallFeedbacks(accessToken, filters);
      setFeedbacks(response.feedbacks);
      setTotalCount(response.total);
      setHasNext(response.has_next);
      setCurrentOffset(offset);
      setHasFetched(true);
    } catch (error) {
      console.error('Error fetching extension uninstall feedbacks:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to load uninstall feedbacks';
      setToast({ message: errorMessage, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFetch = () => {
    setCurrentOffset(0);
    fetchFeedbacks(0);
  };

  const handlePrevious = () => {
    const newOffset = Math.max(0, currentOffset - PAGE_SIZE);
    fetchFeedbacks(newOffset);
  };

  const handleNext = () => {
    if (hasNext) {
      fetchFeedbacks(currentOffset + PAGE_SIZE);
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

  const reasonOptions: { value: ReasonFilter; label: string }[] = [
    { value: '', label: 'All Reasons' },
    ...Object.values(ExtensionUninstallationReason).map((r) => ({
      value: r,
      label: REASON_LABELS[r],
    })),
  ];

  const selectedReasonLabel =
    reasonOptions.find((opt) => opt.value === reasonFilter)?.label || 'All Reasons';

  // Auto-fetch on mount
  useEffect(() => {
    if (accessToken && !hasFetched) {
      fetchFeedbacks(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(`.${styles.filterContainer}`)) {
        setIsReasonDropdownOpen(false);
      }
    };

    if (isReasonDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isReasonDropdownOpen]);

  return (
    <div className={styles.adminExtensionUninstallFeedback}>
      <div className={styles.header}>
        <div className={styles.filters}>
          {/* Reason Dropdown */}
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Reason</label>
            <div className={styles.filterContainer}>
              <button
                className={styles.filterButton}
                onClick={() => setIsReasonDropdownOpen((v) => !v)}
                aria-haspopup="listbox"
                aria-expanded={isReasonDropdownOpen}
              >
                <span>{selectedReasonLabel}</span>
                <DropdownIcon isOpen={isReasonDropdownOpen} />
              </button>
              {isReasonDropdownOpen && (
                <div className={styles.filterDropdown} role="listbox">
                  {reasonOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={`${styles.filterOption} ${reasonFilter === option.value ? styles.filterOptionSelected : ''}`}
                      onClick={() => {
                        setReasonFilter(option.value);
                        setIsReasonDropdownOpen(false);
                      }}
                      role="option"
                      aria-selected={reasonFilter === option.value}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Date From */}
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>From</label>
            <input
              type="date"
              className={styles.dateInput}
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              max={dateTo || undefined}
            />
          </div>

          {/* Date To */}
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>To</label>
            <input
              type="date"
              className={styles.dateInput}
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              min={dateFrom || undefined}
            />
          </div>
        </div>

        {/* Fetch Button */}
        <button className={styles.fetchButton} onClick={handleFetch} disabled={isLoading}>
          <span>{isLoading ? 'Fetching...' : 'Fetch'}</span>
        </button>
      </div>

      {/* Loading State */}
      {isLoading && <div className={styles.loading}>Loading feedbacks...</div>}

      {/* Initial State */}
      {!isLoading && !hasFetched && (
        <div className={styles.initialState}>
          <h2 className={styles.initialHeading}>Fetch Uninstall Feedbacks</h2>
          <p className={styles.initialMessage}>
            Use the filters above and click Fetch to load uninstall feedbacks.
          </p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && hasFetched && feedbacks.length === 0 && (
        <div className={styles.emptyState}>
          <h2 className={styles.emptyHeading}>No feedbacks found</h2>
          <p className={styles.emptyMessage}>
            No feedbacks match the current filters. Try adjusting your filters and fetch again.
          </p>
        </div>
      )}

      {/* Feedbacks List */}
      {!isLoading && hasFetched && feedbacks.length > 0 && (
        <>
          <div className={styles.feedbackList}>
            {feedbacks.map((feedback, index) => (
              <div
                key={feedback.id}
                className={styles.feedbackCard}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className={styles.cardHeader}>
                  <div className={styles.cardMeta}>
                    <span className={`${styles.reasonBadge} ${styles[`reason_${feedback.reason}`]}`}>
                      {REASON_LABELS[feedback.reason] ?? feedback.reason}
                    </span>
                  </div>
                  <span className={styles.feedbackDate}>{formatDate(feedback.created_at)}</span>
                </div>

                {feedback.metadata &&
                  Object.entries(feedback.metadata).filter(([, v]) => v != null).length > 0 && (
                    <div className={styles.metadataSection}>
                      {Object.entries(feedback.metadata)
                        .filter(([, v]) => v != null)
                        .map(([key, value]) => (
                          <span key={key} className={styles.metadataItem}>
                            <span className={styles.metadataKey}>{key}:</span>{' '}
                            <span className={styles.metadataValue}>
                              {typeof value === 'string' ? value : JSON.stringify(value)}
                            </span>
                          </span>
                        ))}
                    </div>
                  )}
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          <div className={styles.pagination}>
            <button
              className={styles.paginationButton}
              onClick={handlePrevious}
              disabled={currentOffset === 0 || isLoading}
            >
              <ChevronLeft />
              <span>Previous</span>
            </button>
            <span className={styles.paginationInfo}>
              Showing {currentOffset + 1}–{Math.min(currentOffset + PAGE_SIZE, totalCount)} of{' '}
              {totalCount} feedbacks
            </span>
            <button
              className={styles.paginationButton}
              onClick={handleNext}
              disabled={!hasNext || isLoading}
            >
              <span>Next</span>
              <ChevronRight />
            </button>
          </div>
        </>
      )}

      {/* Toast Notification */}
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
};

AdminExtensionUninstallFeedback.displayName = 'AdminExtensionUninstallFeedback';
