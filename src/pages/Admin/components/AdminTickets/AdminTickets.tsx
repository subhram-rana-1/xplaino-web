import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiCopy, FiCheck, FiRefreshCw, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import styles from './AdminTickets.module.css';
import { getAllIssues } from '@/shared/services/issues.service';
import type { IssueResponse, GetAllIssuesFilters } from '@/shared/types/issues.types';
import { IssueType } from '@/shared/types/issues.types';
import { Toast } from '@/shared/components/Toast';
import { DropdownIcon } from '@/shared/components/DropdownIcon';

type StatusFilter = '' | 'OPEN' | 'WORK_IN_PROGRESS' | 'DISCARDED' | 'RESOLVED';
type TypeFilter = '' | 'GLITCH' | 'SUBSCRIPTION' | 'AUTHENTICATION' | 'FEATURE_REQUEST' | 'OTHERS';

const PAGE_SIZE = 20;

interface AdminTicketsProps {
  accessToken: string | null;
}

/**
 * AdminTickets - Admin tickets management component
 * 
 * @returns JSX element
 */
export const AdminTickets: React.FC<AdminTicketsProps> = ({ accessToken }) => {
  const navigate = useNavigate();
  const [issues, setIssues] = useState<IssueResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);
  
  // Pagination states
  const [currentOffset, setCurrentOffset] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  
  // Filter states
  const [ticketIdFilter, setTicketIdFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('');
  
  // Dropdown states
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  
  const [copiedTicketId, setCopiedTicketId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type?: 'success' | 'error' } | null>(null);

  const fetchIssues = async (offset: number) => {
    if (!accessToken) {
      setToast({ message: 'Authentication required', type: 'error' });
      return;
    }

    try {
      setIsLoading(true);
      
      const filters: GetAllIssuesFilters = {
        offset,
        limit: PAGE_SIZE,
      };
      if (ticketIdFilter.trim()) {
        filters.ticket_id = ticketIdFilter.trim();
      }
      if (statusFilter) {
        filters.status = statusFilter;
      }
      if (typeFilter) {
        filters.type = typeFilter;
      }
      
      const response = await getAllIssues(accessToken, filters);
      setIssues(response.issues);
      setTotalCount(response.total);
      setHasNext(response.has_next);
      setCurrentOffset(offset);
      setHasFetched(true);
    } catch (error) {
      console.error('Error fetching issues:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load issues';
      setToast({ message: errorMessage, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFetch = () => {
    setCurrentOffset(0);
    fetchIssues(0);
  };

  const handlePrevious = () => {
    const newOffset = Math.max(0, currentOffset - PAGE_SIZE);
    fetchIssues(newOffset);
  };

  const handleNext = () => {
    if (hasNext) {
      fetchIssues(currentOffset + PAGE_SIZE);
    }
  };

  const getIssueTypeLabel = (type: string): string => {
    const typeMap: Record<string, string> = {
      [IssueType.GLITCH]: 'Glitch',
      [IssueType.SUBSCRIPTION]: 'Subscription',
      [IssueType.AUTHENTICATION]: 'Authentication',
      [IssueType.FEATURE_REQUEST]: 'Feature Request',
      [IssueType.OTHERS]: 'Others',
    };
    return typeMap[type] || type;
  };

  const getStatusLabel = (status: string): string => {
    const statusMap: Record<string, string> = {
      'OPEN': 'Open',
      'WORK_IN_PROGRESS': 'Work in Progress',
      'DISCARDED': 'Discarded',
      'RESOLVED': 'Resolved',
    };
    return statusMap[status] || status;
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

  const handleCopy = async (ticketId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(ticketId);
      setCopiedTicketId(ticketId);
      setTimeout(() => {
        setCopiedTicketId(null);
      }, 2000);
    } catch (error) {
      console.error('Failed to copy ticket ID:', error);
    }
  };

  const handleCardClick = (issue: IssueResponse) => {
    navigate(`/admin/issue/${issue.ticket_id}`, { state: { issue } });
  };

  const statusOptions: { value: StatusFilter; label: string }[] = [
    { value: '', label: 'All Statuses' },
    { value: 'OPEN', label: 'Open' },
    { value: 'WORK_IN_PROGRESS', label: 'Work in Progress' },
    { value: 'DISCARDED', label: 'Discarded' },
    { value: 'RESOLVED', label: 'Resolved' },
  ];

  const typeOptions: { value: TypeFilter; label: string }[] = [
    { value: '', label: 'All Types' },
    { value: 'GLITCH', label: 'Glitch' },
    { value: 'SUBSCRIPTION', label: 'Subscription' },
    { value: 'AUTHENTICATION', label: 'Authentication' },
    { value: 'FEATURE_REQUEST', label: 'Feature Request' },
    { value: 'OTHERS', label: 'Others' },
  ];

  const selectedStatusLabel = statusOptions.find(opt => opt.value === statusFilter)?.label || 'All Statuses';
  const selectedTypeLabel = typeOptions.find(opt => opt.value === typeFilter)?.label || 'All Types';

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(`.${styles.filterContainer}`)) {
        setIsStatusDropdownOpen(false);
        setIsTypeDropdownOpen(false);
      }
    };

    if (isStatusDropdownOpen || isTypeDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isStatusDropdownOpen, isTypeDropdownOpen]);

  return (
    <div className={styles.adminTickets}>
      <div className={styles.header}>
        <button
          className={styles.refreshButton}
          onClick={() => fetchIssues(currentOffset)}
          disabled={isLoading}
          title="Refresh issues"
        >
          <FiRefreshCw className={isLoading ? styles.spin : ''} />
        </button>
        <div className={styles.filters}>
          {/* Ticket ID Input */}
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Ticket ID</label>
            <input
              type="text"
              className={styles.ticketIdInput}
              placeholder="Enter ticket ID..."
              value={ticketIdFilter}
              onChange={(e) => setTicketIdFilter(e.target.value)}
            />
          </div>

          {/* Type Dropdown */}
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Type</label>
            <div className={styles.filterContainer}>
              <button
                className={styles.filterButton}
                onClick={() => {
                  setIsTypeDropdownOpen(!isTypeDropdownOpen);
                  setIsStatusDropdownOpen(false);
                }}
                aria-haspopup="listbox"
                aria-expanded={isTypeDropdownOpen}
              >
                <span>{selectedTypeLabel}</span>
                <DropdownIcon isOpen={isTypeDropdownOpen} />
              </button>
              {isTypeDropdownOpen && (
                <div className={styles.filterDropdown} role="listbox">
                  {typeOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={`${styles.filterOption} ${typeFilter === option.value ? styles.filterOptionSelected : ''}`}
                      onClick={() => {
                        setTypeFilter(option.value);
                        setIsTypeDropdownOpen(false);
                      }}
                      role="option"
                      aria-selected={typeFilter === option.value}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Status Dropdown */}
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Status</label>
            <div className={styles.filterContainer}>
              <button
                className={styles.filterButton}
                onClick={() => {
                  setIsStatusDropdownOpen(!isStatusDropdownOpen);
                  setIsTypeDropdownOpen(false);
                }}
                aria-haspopup="listbox"
                aria-expanded={isStatusDropdownOpen}
              >
                <span>{selectedStatusLabel}</span>
                <DropdownIcon isOpen={isStatusDropdownOpen} />
              </button>
              {isStatusDropdownOpen && (
                <div className={styles.filterDropdown} role="listbox">
                  {statusOptions.map((option) => (
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

        {/* Fetch Button */}
        <button
          className={styles.fetchButton}
          onClick={handleFetch}
          disabled={isLoading}
        >
          <FiRefreshCw className={isLoading ? 'spin' : ''} />
          <span>{isLoading ? 'Fetching...' : 'Fetch'}</span>
        </button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className={styles.loading}>Loading issues...</div>
      )}

      {/* Initial State - Before first fetch */}
      {!isLoading && !hasFetched && (
        <div className={styles.initialState}>
          <h2 className={styles.initialHeading}>Fetch Issues</h2>
          <p className={styles.initialMessage}>
            Use the filters above and click Fetch to load issues.
          </p>
        </div>
      )}

      {/* Empty State - After fetch with no results */}
      {!isLoading && hasFetched && issues.length === 0 && (
        <div className={styles.emptyState}>
          <h2 className={styles.emptyHeading}>No issues found</h2>
          <p className={styles.emptyMessage}>
            No issues match the current filters. Try adjusting your filters and fetch again.
          </p>
        </div>
      )}

      {/* Issues List */}
      {!isLoading && hasFetched && issues.length > 0 && (
        <>
          <div className={styles.issuesList}>
            {issues.map((issue, index) => (
              <div
                key={issue.id}
                className={styles.issueCard}
                onClick={() => handleCardClick(issue)}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className={styles.issueHeader}>
                  <div className={styles.issueTitleRow}>
                    <div className={styles.ticketIdRow}>
                      <span className={styles.ticketId}>Ticket ID: {issue.ticket_id}</span>
                      <div className={styles.copyButtonWrapper}>
                        <button
                          className={styles.copyButton}
                          onClick={(e) => handleCopy(issue.ticket_id, e)}
                          aria-label={`Copy ${issue.ticket_id}`}
                          title="Copy ticket ID"
                        >
                          {copiedTicketId === issue.ticket_id ? (
                            <FiCheck className={styles.checkIcon} />
                          ) : (
                            <FiCopy />
                          )}
                        </button>
                        {copiedTicketId === issue.ticket_id && (
                          <div className={styles.copiedTooltip}>Copied</div>
                        )}
                      </div>
                      {issue.heading && (
                        <span className={styles.issueHeadingInline}>{issue.heading}</span>
                      )}
                    </div>
                    <span className={`${styles.status} ${styles[`status${issue.status}`]}`}>
                      {getStatusLabel(issue.status)}
                    </span>
                  </div>
                  <div className={styles.issueMeta}>
                    <span className={styles.issueType}>{getIssueTypeLabel(issue.type)}</span>
                    <span className={styles.issueDate}>{formatDate(issue.created_at)}</span>
                  </div>
                </div>
                <p className={styles.issueDescription}>{issue.description}</p>
                {issue.webpage_url && (
                  <div className={styles.issueUrl}>
                    <span className={styles.urlLabel}>URL:</span>
                    <a
                      href={issue.webpage_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.urlLink}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {issue.webpage_url}
                    </a>
                  </div>
                )}
                {issue.file_uploads && issue.file_uploads.length > 0 && (
                  <div className={styles.issueFiles}>
                    <span className={styles.filesLabel}>Attachments:</span>
                    <div className={styles.filesList}>
                      {issue.file_uploads.map((file) => (
                        <a
                          key={file.id}
                          href={file.s3_url || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.fileLink}
                          onClick={(e) => e.stopPropagation()}
                          title={file.file_name}
                        >
                          <span className={styles.fileIcon}>
                            {file.file_type === 'IMAGE' ? '🖼️' : '📄'}
                          </span>
                          <span className={styles.fileName}>{file.file_name}</span>
                        </a>
                      ))}
                    </div>
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
              <FiChevronLeft />
              <span>Previous</span>
            </button>
            <span className={styles.paginationInfo}>
              Showing {currentOffset + 1}-{Math.min(currentOffset + PAGE_SIZE, totalCount)} of {totalCount} issues
            </span>
            <button
              className={styles.paginationButton}
              onClick={handleNext}
              disabled={!hasNext || isLoading}
            >
              <span>Next</span>
              <FiChevronRight />
            </button>
          </div>
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
    </div>
  );
};

AdminTickets.displayName = 'AdminTickets';

