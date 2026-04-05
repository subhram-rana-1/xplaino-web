import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Copy, Download } from 'lucide-react';
import styles from './AdminSubscriptions.module.css';
import { getAllSubscriptions } from '@/shared/services/adminSubscription.service';
import type { AdminSubscriptionResponse, GetAllSubscriptionsFilters } from '@/shared/types/subscription.types';
import { Toast } from '@/shared/components/Toast';
import { DropdownIcon } from '@/shared/components/DropdownIcon';

type StatusFilter = '' | 'ACTIVE' | 'CANCELED' | 'PAST_DUE' | 'PAUSED' | 'TRIALING';

const PAGE_SIZE = 50;

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: '', label: 'All Statuses' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'TRIALING', label: 'Trialing' },
  { value: 'PAST_DUE', label: 'Past Due' },
  { value: 'PAUSED', label: 'Paused' },
  { value: 'CANCELED', label: 'Canceled' },
];

const STATUS_BADGE_CLASS: Record<string, string> = {
  ACTIVE: 'statusActive',
  TRIALING: 'statusTrialing',
  PAST_DUE: 'statusPastDue',
  PAUSED: 'statusPaused',
  CANCELED: 'statusCanceled',
};

interface AdminSubscriptionsProps {
  accessToken: string | null;
}

/**
 * AdminSubscriptions - Admin subscription management component
 *
 * @returns JSX element
 */
export const AdminSubscriptions: React.FC<AdminSubscriptionsProps> = ({ accessToken }) => {
  const [subscriptions, setSubscriptions] = useState<AdminSubscriptionResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);

  const [currentOffset, setCurrentOffset] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [hasNext, setHasNext] = useState(false);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ACTIVE');
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);

  const [toast, setToast] = useState<{ message: string; type?: 'success' | 'error' } | null>(null);

  const fetchSubscriptions = async (offset: number) => {
    if (!accessToken) {
      setToast({ message: 'Authentication required', type: 'error' });
      return;
    }

    try {
      setIsLoading(true);

      const filters: GetAllSubscriptionsFilters = {
        offset,
        limit: PAGE_SIZE,
      };
      if (statusFilter) {
        filters.status = statusFilter;
      }

      const response = await getAllSubscriptions(accessToken, filters);
      setSubscriptions(response.subscriptions);
      setTotalCount(response.total);
      setHasNext(response.has_next);
      setCurrentOffset(offset);
      setHasFetched(true);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load subscriptions';
      setToast({ message: errorMessage, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFetch = () => {
    setCurrentOffset(0);
    fetchSubscriptions(0);
  };

  const handlePrevious = () => {
    const newOffset = Math.max(0, currentOffset - PAGE_SIZE);
    fetchSubscriptions(newOffset);
  };

  const handleNext = () => {
    if (hasNext) {
      fetchSubscriptions(currentOffset + PAGE_SIZE);
    }
  };

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return '—';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const getPlanName = (sub: AdminSubscriptionResponse): string => {
    return sub.items?.[0]?.price?.name ?? '—';
  };

  const getBillingCycle = (sub: AdminSubscriptionResponse): string => {
    const { billing_cycle_frequency, billing_cycle_interval } = sub;
    if (!billing_cycle_interval) return '—';
    const interval = billing_cycle_interval.charAt(0) + billing_cycle_interval.slice(1).toLowerCase();
    return billing_cycle_frequency === 1 ? interval : `${billing_cycle_frequency} ${interval}s`;
  };

  const handleCopyEmails = async () => {
    const emails = subscriptions
      .map((s) => s.customer_email)
      .filter(Boolean)
      .join('\n');
    try {
      await navigator.clipboard.writeText(emails);
      setToast({
        message: `Copied ${subscriptions.filter((s) => s.customer_email).length} emails to clipboard`,
        type: 'success',
      });
    } catch {
      setToast({ message: 'Failed to copy to clipboard', type: 'error' });
    }
  };

  const handleDownloadCsv = () => {
    const header = 'SN,Customer Email,Status,Plan,Billing Cycle,Next Billed At,Started At';
    const rows = subscriptions.map((sub, index) => {
      const sn = currentOffset + index + 1;
      const escape = (val: string) => `"${val.replace(/"/g, '""')}"`;
      return [
        sn,
        escape(sub.customer_email ?? ''),
        escape(sub.status),
        escape(getPlanName(sub)),
        escape(getBillingCycle(sub)),
        escape(formatDate(sub.next_billed_at)),
        escape(formatDate(sub.started_at)),
      ].join(',');
    });
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `subscriptions-page-${Math.floor(currentOffset / PAGE_SIZE) + 1}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const selectedStatusLabel =
    STATUS_OPTIONS.find((opt) => opt.value === statusFilter)?.label || 'All Statuses';

  useEffect(() => {
    if (accessToken && !hasFetched) {
      fetchSubscriptions(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(`.${styles.filterContainer}`)) {
        setIsStatusDropdownOpen(false);
      }
    };

    if (isStatusDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isStatusDropdownOpen]);

  return (
    <div className={styles.adminSubscriptions}>
      <div className={styles.header}>
        <div className={styles.filters}>
          {/* Status Dropdown */}
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Status</label>
            <div className={styles.filterContainer}>
              <button
                className={styles.filterButton}
                onClick={() => setIsStatusDropdownOpen((v) => !v)}
                aria-haspopup="listbox"
                aria-expanded={isStatusDropdownOpen}
              >
                <span>{selectedStatusLabel}</span>
                <DropdownIcon isOpen={isStatusDropdownOpen} />
              </button>
              {isStatusDropdownOpen && (
                <div className={styles.filterDropdown} role="listbox">
                  {STATUS_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={`${styles.filterOption} ${statusFilter === option.value ? styles.filterOptionSelected : ''}`}
                      onClick={() => {
                        setStatusFilter(option.value);
                        setIsStatusDropdownOpen(false);
                      }}
                      role="option"
                      aria-selected={statusFilter === option.value}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className={styles.headerRight}>
          {hasFetched && subscriptions.length > 0 && (
            <>
              <button className={styles.actionButton} onClick={handleCopyEmails}>
                <Copy size={15} />
                <span>Copy Emails</span>
              </button>
              <button className={styles.actionButton} onClick={handleDownloadCsv}>
                <Download size={15} />
                <span>Download CSV</span>
              </button>
            </>
          )}
          <button className={styles.fetchButton} onClick={handleFetch} disabled={isLoading}>
            <span>{isLoading ? 'Fetching...' : 'Fetch'}</span>
          </button>
        </div>
      </div>

      {isLoading && <div className={styles.loading}>Loading subscriptions...</div>}

      {!isLoading && !hasFetched && (
        <div className={styles.initialState}>
          <h2 className={styles.initialHeading}>Fetch Subscriptions</h2>
          <p className={styles.initialMessage}>
            Use the filters above and click Fetch to load subscriptions.
          </p>
        </div>
      )}

      {!isLoading && hasFetched && subscriptions.length === 0 && (
        <div className={styles.emptyState}>
          <h2 className={styles.emptyHeading}>No subscriptions found</h2>
          <p className={styles.emptyMessage}>
            No subscriptions match the current filters. Try adjusting your filters and fetch again.
          </p>
        </div>
      )}

      {!isLoading && hasFetched && subscriptions.length > 0 && (
        <>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={`${styles.th} ${styles.thSn}`}>SN</th>
                  <th className={styles.th}>Customer Email</th>
                  <th className={styles.th}>Status</th>
                  <th className={styles.th}>Plan</th>
                  <th className={styles.th}>Billing Cycle</th>
                  <th className={styles.th}>Next Billed</th>
                  <th className={styles.th}>Started</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map((sub, index) => (
                  <tr
                    key={sub.id}
                    className={styles.tr}
                    style={{ animationDelay: `${index * 0.04}s` }}
                  >
                    <td className={`${styles.td} ${styles.tdSn}`}>
                      <span className={styles.snNumber}>{currentOffset + index + 1}</span>
                    </td>
                    <td className={styles.td}>
                      <span className={styles.email}>{sub.customer_email ?? '—'}</span>
                    </td>
                    <td className={styles.td}>
                      <span
                        className={`${styles.statusBadge} ${styles[STATUS_BADGE_CLASS[sub.status.toUpperCase()] ?? 'statusCanceled']}`}
                      >
                        {sub.status.charAt(0).toUpperCase() + sub.status.slice(1).toLowerCase().replace('_', ' ')}
                      </span>
                    </td>
                    <td className={styles.td}>
                      <span className={styles.planName}>{getPlanName(sub)}</span>
                    </td>
                    <td className={styles.td}>
                      <span className={styles.muted}>{getBillingCycle(sub)}</span>
                    </td>
                    <td className={styles.td}>
                      <span className={styles.date}>{formatDate(sub.next_billed_at)}</span>
                    </td>
                    <td className={styles.td}>
                      <span className={styles.date}>{formatDate(sub.started_at)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

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
              {totalCount} subscriptions
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

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
};

AdminSubscriptions.displayName = 'AdminSubscriptions';
