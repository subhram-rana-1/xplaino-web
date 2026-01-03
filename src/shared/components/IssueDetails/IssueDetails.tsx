import React, { useState, useEffect, useRef } from 'react';
import { FiCopy, FiCheck, FiChevronDown } from 'react-icons/fi';
import styles from './IssueDetails.module.css';
import { IssueType, IssueStatus } from '@/shared/types/issues.types';
import type { IssueResponse, GetIssueByTicketIdResponse } from '@/shared/types/issues.types';
import type { CommentResponse } from '@/shared/types/comments.types';
import { CommentSection } from '@/pages/IssueDetail/components/CommentSection';

interface IssueDetailsProps {
  issue: IssueResponse | GetIssueByTicketIdResponse | undefined;
  isAdmin?: boolean;
  isLoading?: boolean;
  accessToken: string | null;
  user?: { id: string; role?: 'ADMIN' | 'SUPER_ADMIN' | null } | null;
  onBack: () => void;
  onStatusUpdate?: (status: IssueStatus) => Promise<void>;
  canEditStatus?: boolean;
  selectedStatus?: IssueStatus | null;
  onStatusSelect?: (status: IssueStatus) => void;
  isUpdating?: boolean;
  creatorName?: string;
  comments: CommentResponse[];
  onCommentsChange: (comments: CommentResponse[]) => void;
  issueCreatedBy: string; // user ID for comments
  canAddComment?: boolean;
  toast?: { message: string; type?: 'success' | 'error' } | null;
  onToastClose?: () => void;
  isStatusDropdownOpen?: boolean;
  onStatusDropdownToggle?: () => void;
  hasStatusChanged?: boolean;
}

/**
 * IssueDetails - Reusable component for displaying issue details
 * Used in both user and admin routes
 */
export const IssueDetails: React.FC<IssueDetailsProps> = ({
  issue,
  isAdmin = false,
  isLoading = false,
  accessToken,
  user: _user,
  onBack: _onBack,
  onStatusUpdate,
  canEditStatus = false,
  selectedStatus,
  onStatusSelect,
  isUpdating = false,
  creatorName,
  comments,
  onCommentsChange,
  issueCreatedBy,
  canAddComment = true,
  toast: _toast,
  onToastClose: _onToastClose,
  isStatusDropdownOpen = false,
  onStatusDropdownToggle,
  hasStatusChanged = false,
}) => {
  const [copiedTicketId, setCopiedTicketId] = useState(false);
  const statusContainerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isAdmin || !canEditStatus) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (statusContainerRef.current && !statusContainerRef.current.contains(target)) {
        if (isStatusDropdownOpen && onStatusDropdownToggle) {
          onStatusDropdownToggle();
        }
      }
    };

    if (isStatusDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isStatusDropdownOpen, isAdmin, canEditStatus, onStatusDropdownToggle]);

  // Helper function to get issue status
  const getIssueStatus = (issue: IssueResponse | GetIssueByTicketIdResponse): string => {
    return issue.status;
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

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  const handleCopy = async () => {
    if (!issue) return;
    try {
      await navigator.clipboard.writeText(issue.ticket_id);
      setCopiedTicketId(true);
      setTimeout(() => {
        setCopiedTicketId(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to copy ticket ID:', error);
    }
  };

  const handleUpdate = async () => {
    if (onStatusUpdate && selectedStatus) {
      await onStatusUpdate(selectedStatus);
    }
  };

  const statusOptions: { value: IssueStatus; label: string }[] = [
    { value: IssueStatus.OPEN, label: 'Open' },
    { value: IssueStatus.WORK_IN_PROGRESS, label: 'Work in Progress' },
    { value: IssueStatus.DISCARDED, label: 'Discarded' },
    { value: IssueStatus.RESOLVED, label: 'Resolved' },
  ];

  if (isLoading) {
    return (
      <div className={styles.issueDetail}>
        <div className={styles.container}>
          <div className={styles.loading}>Loading issue...</div>
        </div>
      </div>
    );
  }

  if (!issue) {
    return null;
  }

  const currentStatusDisplay = selectedStatus || (getIssueStatus(issue) as IssueStatus);
  const issueStatus = getIssueStatus(issue);
  const shouldHideCommentButton = issueStatus === IssueStatus.RESOLVED || issueStatus === IssueStatus.DISCARDED;
  const finalCanAddComment = canAddComment && !shouldHideCommentButton;

  return (
    <div className={styles.issueDetail}>
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.details}>
            <div className={styles.detailRow}>
              <div className={styles.ticketIdRow}>
                <div className={styles.valueRow}>
                  <span className={styles.ticketIdLabel}>Ticket Id: </span>
                  <span className={styles.ticketIdValue}>{issue.ticket_id}</span>
                  <div className={styles.copyButtonWrapper}>
                    <button
                      className={styles.copyButton}
                      onClick={handleCopy}
                      aria-label={`Copy ${issue.ticket_id}`}
                      title="Copy ticket ID"
                    >
                      {copiedTicketId ? (
                        <FiCheck className={styles.checkIcon} />
                      ) : (
                        <FiCopy />
                      )}
                    </button>
                    {copiedTicketId && (
                      <div className={styles.copiedTooltip}>Copied</div>
                    )}
                  </div>
                </div>
                
                {/* Status Display - Editable for admin, read-only for user */}
                {isAdmin && canEditStatus ? (
                  <div className={styles.statusContainer} ref={statusContainerRef}>
                    <button
                      className={`${styles.statusDropdownButton} ${styles[`statusDropdownButton${currentStatusDisplay}`]}`}
                      onClick={onStatusDropdownToggle}
                      aria-haspopup="listbox"
                      aria-expanded={isStatusDropdownOpen}
                    >
                      <span>{getStatusLabel(currentStatusDisplay)}</span>
                      <FiChevronDown />
                    </button>
                    {isStatusDropdownOpen && (
                      <div className={styles.statusDropdown} role="listbox">
                        {statusOptions.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            className={`${styles.statusOption} ${currentStatusDisplay === option.value ? styles.statusOptionSelected : ''}`}
                            onClick={() => onStatusSelect?.(option.value)}
                            role="option"
                            aria-selected={currentStatusDisplay === option.value}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <span className={`${styles.status} ${styles[`status${issueStatus}`]}`}>
                    {getStatusLabel(issueStatus)}
                  </span>
                )}
              </div>
            </div>

            <div className={styles.detailRow}>
              <div className={styles.issueTypeRow}>
                <span className={styles.issueTypeLabel}>Issue Type: </span>
                <span className={`${styles.issueTypeBadge} ${styles[`issueType${issue.type}`]}`}>
                  {getIssueTypeLabel(issue.type)}
                </span>
              </div>
            </div>

            <div className={styles.detailRow}>
              <div className={styles.raisedOnRow}>
                <span className={styles.raisedOnLabel}>Raised on: </span>
                <span className={styles.raisedOnValue}>{formatDate(issue.created_at)}</span>
              </div>
            </div>

            {isAdmin && creatorName && (
              <div className={styles.detailRow}>
                <div className={styles.raisedOnRow}>
                  <span className={styles.raisedOnLabel}>Created by: </span>
                  <span className={styles.raisedOnValue}>
                    {creatorName || 'Loading...'}
                  </span>
                </div>
              </div>
            )}

            {issue.heading && (
              <div className={`${styles.detailRow} ${styles.headingRow}`}>
                <h2 className={styles.headingText}>{issue.heading}</h2>
              </div>
            )}

            <div className={styles.detailRow}>
              <p className={styles.descriptionText}>{issue.description}</p>
            </div>

            {issue.webpage_url && (
              <div className={styles.detailRow}>
                <span className={styles.value}>
                  Webpage URL:{' '}
                  <a
                    href={issue.webpage_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.urlValue}
                  >
                    {issue.webpage_url}
                  </a>
                </span>
              </div>
            )}

            {issue.file_uploads && issue.file_uploads.length > 0 && (
              <div className={styles.detailRow}>
                <label className={styles.label}>Attachments</label>
                <div className={styles.filesContainer}>
                  {issue.file_uploads.map((file) => (
                    <div key={file.id} className={styles.fileItem}>
                      {file.file_type === 'IMAGE' && file.s3_url ? (
                        <div className={styles.imagePreview}>
                          <img
                            src={file.s3_url}
                            alt={file.file_name}
                            className={styles.previewImage}
                            loading="lazy"
                          />
                          <a
                            href={file.s3_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.fileLink}
                            title={file.file_name}
                          >
                            <span className={styles.fileName}>{file.file_name}</span>
                            <span className={styles.fileOpenIcon}>↗</span>
                          </a>
                        </div>
                      ) : (
                        <a
                          href={file.s3_url || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.fileLink}
                          title={file.file_name}
                        >
                          <span className={styles.fileIcon}>📄</span>
                          <span className={styles.fileName}>{file.file_name}</span>
                          <span className={styles.fileOpenIcon}>↗</span>
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {issue.closed_at && (
              <div className={styles.detailRow}>
                <div className={styles.raisedOnRow}>
                  <span className={styles.raisedOnLabel}>Closed At: </span>
                  <span className={styles.raisedOnValue}>{formatDate(issue.closed_at)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Update Button Section - Admin only */}
          {isAdmin && canEditStatus && (
            <div className={styles.updateSection}>
              <button
                className={styles.updateButton}
                onClick={handleUpdate}
                disabled={!hasStatusChanged || isUpdating}
              >
                {isUpdating ? 'Updating...' : 'Update'}
              </button>
            </div>
          )}

          {/* Comments Section */}
          {accessToken && issue.id && (
            <CommentSection
              issueId={issue.id}
              accessToken={accessToken}
              comments={comments}
              onCommentsChange={onCommentsChange}
              issueCreatedBy={issueCreatedBy}
              canAddComment={finalCanAddComment}
            />
          )}
        </div>
      </div>
    </div>
  );
};

IssueDetails.displayName = 'IssueDetails';

