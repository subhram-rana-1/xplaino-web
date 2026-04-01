import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './AdminUserFeedback.module.css';
import { getAllUserFeedbacks } from '@/shared/services/userFeedback.service';
import type { UserFeedbackResponse, GetAllUserFeedbacksFilters } from '@/shared/types/userFeedback.types';
import { UserFeedbackVerdict } from '@/shared/types/userFeedback.types';
import { Toast } from '@/shared/components/Toast';
import { DropdownIcon } from '@/shared/components/DropdownIcon';

type VerdictFilter = '' | 'UNHAPPY' | 'NEUTRAL' | 'HAPPY';

const PAGE_SIZE = 20;

interface AdminUserFeedbackProps {
  accessToken: string | null;
}

/**
 * AdminUserFeedback - Admin user feedback management component
 *
 * @returns JSX element
 */
export const AdminUserFeedback: React.FC<AdminUserFeedbackProps> = ({ accessToken }) => {
  const [feedbacks, setFeedbacks] = useState<UserFeedbackResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);

  // Pagination states
  const [currentOffset, setCurrentOffset] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [hasNext, setHasNext] = useState(false);

  // Filter states
  const [emailFilter, setEmailFilter] = useState('');
  const [verdictFilter, setVerdictFilter] = useState<VerdictFilter>('');

  // Dropdown state
  const [isVerdictDropdownOpen, setIsVerdictDropdownOpen] = useState(false);

  // Expanded Q&A state
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  const [toast, setToast] = useState<{ message: string; type?: 'success' | 'error' } | null>(null);

  const fetchFeedbacks = async (offset: number) => {
    if (!accessToken) {
      setToast({ message: 'Authentication required', type: 'error' });
      return;
    }

    try {
      setIsLoading(true);

      const filters: GetAllUserFeedbacksFilters = {
        offset,
        limit: PAGE_SIZE,
      };
      if (emailFilter.trim()) {
        filters.email = emailFilter.trim();
      }
      if (verdictFilter) {
        filters.verdict = verdictFilter;
      }

      const response = await getAllUserFeedbacks(accessToken, filters);
      setFeedbacks(response.feedbacks);
      setTotalCount(response.total);
      setHasNext(response.has_next);
      setCurrentOffset(offset);
      setHasFetched(true);
      setExpandedCards(new Set());
    } catch (error) {
      console.error('Error fetching user feedbacks:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load user feedbacks';
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

  const toggleExpand = (id: string) => {
    setExpandedCards((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
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

  const verdictOptions: { value: VerdictFilter; label: string }[] = [
    { value: '', label: 'All Verdicts' },
    { value: UserFeedbackVerdict.HAPPY, label: 'Happy' },
    { value: UserFeedbackVerdict.NEUTRAL, label: 'Neutral' },
    { value: UserFeedbackVerdict.UNHAPPY, label: 'Unhappy' },
  ];

  const selectedVerdictLabel =
    verdictOptions.find((opt) => opt.value === verdictFilter)?.label || 'All Verdicts';

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
        setIsVerdictDropdownOpen(false);
      }
    };

    if (isVerdictDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isVerdictDropdownOpen]);

  return (
    <div className={styles.adminUserFeedback}>
      <div className={styles.header}>
        <div className={styles.filters}>
          {/* Email Input */}
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Email</label>
            <input
              type="email"
              className={styles.emailInput}
              placeholder="Enter user email..."
              value={emailFilter}
              onChange={(e) => setEmailFilter(e.target.value)}
            />
          </div>

          {/* Verdict Dropdown */}
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Verdict</label>
            <div className={styles.filterContainer}>
              <button
                className={styles.filterButton}
                onClick={() => setIsVerdictDropdownOpen((v) => !v)}
                aria-haspopup="listbox"
                aria-expanded={isVerdictDropdownOpen}
              >
                <span>{selectedVerdictLabel}</span>
                <DropdownIcon isOpen={isVerdictDropdownOpen} />
              </button>
              {isVerdictDropdownOpen && (
                <div className={styles.filterDropdown} role="listbox">
                  {verdictOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={`${styles.filterOption} ${verdictFilter === option.value ? styles.filterOptionSelected : ''}`}
                      onClick={() => {
                        setVerdictFilter(option.value);
                        setIsVerdictDropdownOpen(false);
                      }}
                      role="option"
                      aria-selected={verdictFilter === option.value}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
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
          <h2 className={styles.initialHeading}>Fetch User Feedbacks</h2>
          <p className={styles.initialMessage}>
            Use the filters above and click Fetch to load user feedbacks.
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
            {feedbacks.map((feedback, index) => {
              const isExpanded = expandedCards.has(feedback.id);
              const hasQnA = feedback.metadata.qna.length > 0;

              return (
                <div
                  key={feedback.id}
                  className={`${styles.feedbackCard} ${hasQnA ? styles.feedbackCardClickable : ''}`}
                  style={{ animationDelay: `${index * 0.05}s` }}
                  onClick={hasQnA ? () => toggleExpand(feedback.id) : undefined}
                  role={hasQnA ? 'button' : undefined}
                  aria-expanded={hasQnA ? isExpanded : undefined}
                >
                  <div className={styles.cardHeader}>
                    <div className={styles.cardMeta}>
                      <span
                        className={`${styles.verdictBadge} ${styles[`verdict${feedback.verdict}`]}`}
                      >
                        {feedback.verdict === UserFeedbackVerdict.HAPPY && '😊 '}
                        {feedback.verdict === UserFeedbackVerdict.NEUTRAL && '😐 '}
                        {feedback.verdict === UserFeedbackVerdict.UNHAPPY && '😞 '}
                        {feedback.verdict.charAt(0) + feedback.verdict.slice(1).toLowerCase()}
                      </span>
                      <span
                        className={styles.userId}
                        title={feedback.user_email ?? feedback.user_id}
                      >
                        {feedback.user_email ?? feedback.user_id}
                      </span>
                    </div>
                    <span className={styles.feedbackDate}>{formatDate(feedback.created_at)}</span>
                  </div>

                  {hasQnA && isExpanded && (
                    <div className={styles.qnaSection}>
                      <div className={styles.qnaList}>
                        {feedback.metadata.qna.map((item, qIdx) => (
                          <div key={qIdx} className={styles.qnaItem}>
                            <p className={styles.qnaQuestion}>{item.question}</p>
                            <p className={styles.qnaAnswer}>{item.answer}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
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

AdminUserFeedback.displayName = 'AdminUserFeedback';
