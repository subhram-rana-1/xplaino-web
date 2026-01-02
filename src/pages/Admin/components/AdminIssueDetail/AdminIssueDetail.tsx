import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiArrowLeft, FiCopy, FiCheck, FiChevronDown } from 'react-icons/fi';
import styles from './AdminIssueDetail.module.css';
import { useAuth } from '@/shared/hooks/useAuth';
import { IssueType, IssueStatus } from '@/shared/types/issues.types';
import type { IssueResponse } from '@/shared/types/issues.types';
import { updateIssue } from '@/shared/services/issues.service';
import { Toast } from '@/shared/components/Toast';

/**
 * AdminIssueDetail - Admin issue detail page component with editable status
 * 
 * @returns JSX element
 */
export const AdminIssueDetail: React.FC = () => {
  const { accessToken } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [copiedTicketId, setCopiedTicketId] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [toast, setToast] = useState<{ message: string; type?: 'success' | 'error' } | null>(null);

  const initialIssue = (location.state as { issue?: IssueResponse } | null)?.issue;
  const [issue, setIssue] = useState<IssueResponse | undefined>(initialIssue);
  const [selectedStatus, setSelectedStatus] = useState<IssueStatus | null>(
    initialIssue ? (initialIssue.status as IssueStatus) : null
  );

  const originalStatus = initialIssue?.status as IssueStatus | undefined;
  const hasStatusChanged = selectedStatus !== null && selectedStatus !== originalStatus;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(`.${styles.statusContainer}`)) {
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

  if (!issue) {
    return (
      <div className={styles.issueDetail}>
        <div className={styles.container}>
          <div className={styles.errorState}>
            <h2 className={styles.errorHeading}>Issue not found</h2>
            <p className={styles.errorMessage}>
              The issue you're looking for could not be found.
            </p>
            <button 
              className={styles.backButton}
              onClick={() => navigate('/admin', { state: { activeSection: 'ticket' } })}
            >
              <FiArrowLeft />
              <span>Back to Tickets</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

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

  const handleStatusSelect = (status: IssueStatus) => {
    setSelectedStatus(status);
    setIsStatusDropdownOpen(false);
  };

  const handleUpdate = async () => {
    if (!accessToken || !selectedStatus || !hasStatusChanged) {
      return;
    }

    try {
      setIsUpdating(true);
      const updatedIssue = await updateIssue(accessToken, issue.id, { status: selectedStatus });
      setIssue(updatedIssue);
      setToast({ message: 'Issue status updated successfully', type: 'success' });
    } catch (error) {
      console.error('Failed to update issue:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update issue';
      setToast({ message: errorMessage, type: 'error' });
    } finally {
      setIsUpdating(false);
    }
  };

  const statusOptions: { value: IssueStatus; label: string }[] = [
    { value: IssueStatus.OPEN, label: 'Open' },
    { value: IssueStatus.WORK_IN_PROGRESS, label: 'Work in Progress' },
    { value: IssueStatus.DISCARDED, label: 'Discarded' },
    { value: IssueStatus.RESOLVED, label: 'Resolved' },
  ];

  const currentStatusDisplay = selectedStatus || (issue.status as IssueStatus);

  return (
    <div className={styles.issueDetail}>
      <div className={styles.container}>
        <button 
          className={styles.backButton}
          onClick={() => navigate('/admin', { state: { activeSection: 'ticket' } })}
        >
          <FiArrowLeft />
          <span>Back to Tickets</span>
        </button>

        <div className={styles.titleContainer}>
          <h1 className={styles.heading}>Issue Details</h1>
        </div>

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
                
                {/* Editable Status Dropdown */}
                <div className={styles.statusContainer}>
                  <button
                    className={`${styles.statusDropdownButton} ${styles[`statusDropdownButton${currentStatusDisplay}`]}`}
                    onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
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
                          onClick={() => handleStatusSelect(option.value)}
                          role="option"
                          aria-selected={currentStatusDisplay === option.value}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
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
                <label className={styles.label}>Closed At</label>
                <span className={styles.value}>{formatDate(issue.closed_at)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Update Button Section */}
        <div className={styles.updateSection}>
          <button
            className={styles.updateButton}
            onClick={handleUpdate}
            disabled={!hasStatusChanged || isUpdating}
          >
            {isUpdating ? 'Updating...' : 'Update'}
          </button>
        </div>

        {/* Toast Notification */}
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </div>
    </div>
  );
};

AdminIssueDetail.displayName = 'AdminIssueDetail';


