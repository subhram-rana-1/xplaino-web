import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FiCopy, FiCheck } from 'react-icons/fi';
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
  const { state, fetchIssues } = useMyIssues();
  const navigate = useNavigate();
  const [toast, setToast] = useState<{ message: string; type?: 'success' | 'error' } | null>(null);
  const [activeTab, setActiveTab] = useState<TabFilter>('ALL');
  const [copiedTicketId, setCopiedTicketId] = useState<string | null>(null);
  const [sliderStyle, setSliderStyle] = useState<{ left: number; width: number }>({ left: 0, width: 0 });
  const [isTransitioning, setIsTransitioning] = useState(false);
  const tabsRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});
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

  // Check for success message from navigation state
  useEffect(() => {
    const navigationState = location.state as { ticketId?: string } | null;
    if (navigationState?.ticketId) {
      setToast({ 
        message: `Issue created successfully. Ticket ID: ${navigationState.ticketId}`, 
        type: 'success' 
      });
      // Clear the state to prevent showing the toast again on re-render
      window.history.replaceState({}, document.title);
    }
  }, [location]);

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

  const updateSliderPosition = () => {
    const activeTabElement = tabRefs.current[activeTab];
    const tabsContainer = tabsRef.current;
    
    if (activeTabElement && tabsContainer) {
      const containerRect = tabsContainer.getBoundingClientRect();
      const tabRect = activeTabElement.getBoundingClientRect();
      
      setSliderStyle({
        left: tabRect.left - containerRect.left,
        width: tabRect.width,
      });
    }
  };

  useEffect(() => {
    updateSliderPosition();
    window.addEventListener('resize', updateSliderPosition);
    return () => window.removeEventListener('resize', updateSliderPosition);
  }, [activeTab]);

  const handleTabClick = (tabValue: TabFilter) => {
    setActiveTab(tabValue);
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
          <h1 className={styles.heading}>My Issues</h1>
          <Link to="/report-issue" className={styles.reportButton}>
            Report an issue
          </Link>
        </div>

        {/* Status Tabs */}
        <div className={styles.tabs} ref={tabsRef}>
          <div 
            className={`${styles.tabSlider} ${styles[`tabSlider${activeTab}`]}`}
            style={{
              transform: `translateX(${sliderStyle.left}px)`,
              width: `${sliderStyle.width}px`,
            }}
          />
          {tabs.map((tab) => (
            <button
              key={tab.value}
              ref={(el) => {
                tabRefs.current[tab.value] = el;
              }}
              className={`${styles.tab} ${activeTab === tab.value ? styles.tabActive : ''} ${styles[`tab${tab.value}`]}`}
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

