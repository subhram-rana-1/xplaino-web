import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FiCopy, FiCheck, FiPlus, FiRefreshCw } from 'react-icons/fi';
import styles from './Issues.module.css';
import { useAuth } from '@/shared/hooks/useAuth';
import { LoginModal } from '@/shared/components/LoginModal';
import { useMyIssues } from '@/shared/hooks/useMyIssues';
import { Toast } from '@/shared/components/Toast';
import { IssueType } from '@/shared/types/issues.types';
import type { IssueResponse } from '@/shared/types/issues.types';

/**
 * Issues - Issues page component displaying all user issues
 * 
 * @returns JSX element
 */
type TabFilter = 'ALL' | 'OPEN' | 'WORK_IN_PROGRESS' | 'DISCARDED' | 'RESOLVED';

export const Issues: React.FC = () => {
  const { isLoggedIn, accessToken } = useAuth();
  const { state, fetchIssues, resetIssues } = useMyIssues();
  const navigate = useNavigate();
  const [toast, setToast] = useState<{ message: string; type?: 'success' | 'error' } | null>(null);
  const [activeTab, setActiveTab] = useState<TabFilter>('OPEN');
  const [copiedTicketId, setCopiedTicketId] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const location = useLocation();

  useEffect(() => {
    if (isLoggedIn && accessToken) {
      // Fetch issues based on active tab
      setIsTransitioning(true);
      const statuses = activeTab === 'ALL' ? undefined : [activeTab];
      fetchIssues(accessToken, statuses)
        .then(() => {
          // Small delay to ensure smooth transition
          setTimeout(() => setIsTransitioning(false), 150);
        })
        .catch((error) => {
          console.error('Error fetching issues:', error);
          setToast({ message: 'Failed to load issues', type: 'error' });
          setIsTransitioning(false);
        });
    }
  }, [isLoggedIn, accessToken, activeTab, fetchIssues]);

  // Check for success message from navigation state and refresh issues
  useEffect(() => {
    const navigationState = location.state as { ticketId?: string } | null;
    if (navigationState?.ticketId && isLoggedIn && accessToken) {
      setToast({ 
        message: `Issue created successfully. Ticket ID: ${navigationState.ticketId}`, 
        type: 'success' 
      });
      
      // Clear cache and refresh issues to show the newly created issue
      resetIssues();
      setIsTransitioning(true);
      const statuses = activeTab === 'ALL' ? undefined : [activeTab];
      fetchIssues(accessToken, statuses)
        .then(() => {
          setTimeout(() => setIsTransitioning(false), 150);
        })
        .catch((error) => {
          console.error('Error refreshing issues:', error);
          setIsTransitioning(false);
        });
      
      // Clear the state to prevent showing the toast again on re-render
      window.history.replaceState({}, document.title);
    }
  }, [location, isLoggedIn, accessToken, activeTab, fetchIssues, resetIssues]);

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
    e.stopPropagation(); // Prevent card click
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
    navigate(`/issue/${issue.ticket_id}`, { state: { issue } });
  };

  const tabs: { value: TabFilter; label: string }[] = [
    { value: 'ALL', label: 'All' },
    { value: 'OPEN', label: 'Open' },
    { value: 'WORK_IN_PROGRESS', label: 'Work in Progress' },
    { value: 'DISCARDED', label: 'Discarded' },
    { value: 'RESOLVED', label: 'Resolved' },
  ];

  const handleTabClick = (tabValue: TabFilter) => {
    setActiveTab(tabValue);
  };

  const handleRefresh = async () => {
    if (!accessToken) return;
    
    setIsTransitioning(true);
    const statuses = activeTab === 'ALL' ? undefined : [activeTab];
    try {
      // Clear cache to force fresh API call
      resetIssues();
      await fetchIssues(accessToken, statuses);
      setTimeout(() => setIsTransitioning(false), 150);
    } catch (error) {
      console.error('Error refreshing issues:', error);
      setToast({ message: 'Failed to refresh issues', type: 'error' });
      setIsTransitioning(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className={styles.issues}>
        <LoginModal actionText="view your issues" />
      </div>
    );
  }

  const isEmpty = !state.isLoading && state.issues.length === 0;

  return (
    <div className={styles.issues}>
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.headingContainer}>
            <h1 className={styles.heading}>My Issues</h1>
          </div>
          <div className={styles.headerRight}>
            <button
              className={styles.refreshButton}
              onClick={handleRefresh}
              disabled={state.isLoading}
              title="Refresh tickets"
            >
              <FiRefreshCw className={state.isLoading ? styles.spin : ''} />
              <span>Refresh tickets</span>
            </button>
            <Link to="/report-issue" className={styles.reportButton} title="Report an issue">
              <FiPlus />
              <span>Report issue</span>
            </Link>
          </div>
        </div>

        {/* Status Tabs */}
        <div className={styles.tabs}>
          {tabs.map((tab) => (
            <button
              key={tab.value}
              className={`${styles.tab} ${activeTab === tab.value ? styles.tabActive : ''}`}
              onClick={() => handleTabClick(tab.value)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Loading State */}
        {state.isLoading && state.issues.length === 0 ? (
          <div className={styles.loading}>Loading...</div>
        ) : isEmpty ? (
          /* Empty State */
          <div className={styles.emptyState}>
            <h2 className={styles.emptyHeading}>No issues yet</h2>
            <p className={styles.emptyMessage}>
              You haven't reported any issues yet
            </p>
          </div>
        ) : (
          /* Issues List */
          <div className={`${styles.issuesList} ${isTransitioning ? styles.issuesListTransitioning : ''}`}>
            {state.issues.map((issue, index) => (
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
    </div>
  );
};

Issues.displayName = 'Issues';

