import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiArrowLeft, FiCopy, FiCheck } from 'react-icons/fi';
import styles from './IssueDetail.module.css';
import { useAuth } from '@/shared/hooks/useAuth';
import { LoginModal } from '@/shared/components/LoginModal';
import { IssueType } from '@/shared/types/issues.types';
import type { IssueResponse } from '@/shared/types/issues.types';

/**
 * IssueDetail - Issue detail page component displaying a single issue
 * 
 * @returns JSX element
 */
export const IssueDetail: React.FC = () => {
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [copiedTicketId, setCopiedTicketId] = useState(false);

  const issue = (location.state as { issue?: IssueResponse } | null)?.issue;

  if (!isLoggedIn) {
    return (
      <div className={styles.issueDetail}>
        <LoginModal actionText="view issue details" />
      </div>
    );
  }

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
              onClick={() => navigate('/issues')}
            >
              <FiArrowLeft />
              <span>Back to Issues</span>
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

  return (
    <div className={styles.issueDetail}>
      <div className={styles.container}>
        <button 
          className={styles.backButton}
          onClick={() => navigate('/issues')}
        >
          <FiArrowLeft />
          <span>Back to Issues</span>
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
                <span className={`${styles.status} ${styles[`status${issue.status}`]}`}>
                  {getStatusLabel(issue.status)}
                </span>
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

            {issue.closed_at && (
              <div className={styles.detailRow}>
                <label className={styles.label}>Closed At</label>
                <span className={styles.value}>{formatDate(issue.closed_at)}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

IssueDetail.displayName = 'IssueDetail';

