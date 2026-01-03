import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import styles from './IssueDetail.module.css';
import { useAuth } from '@/shared/hooks/useAuth';
import { LoginModal } from '@/shared/components/LoginModal';
import type { IssueResponse, GetIssueByTicketIdResponse } from '@/shared/types/issues.types';
import { getIssueByTicketId } from '@/shared/services/issues.service';
import { getCommentsByEntity } from '@/shared/services/comments.service';
import { EntityType } from '@/shared/types/comments.types';
import type { CommentResponse } from '@/shared/types/comments.types';
import { IssueDetails } from '@/shared/components/IssueDetails';
import { IssueStatus } from '@/shared/types/issues.types';

/**
 * IssueDetail - Issue detail page component displaying a single issue
 * 
 * @returns JSX element
 */
export const IssueDetail: React.FC = () => {
  const { isLoggedIn, accessToken, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { ticketId } = useParams<{ ticketId: string }>();
  const [issue, setIssue] = useState<IssueResponse | GetIssueByTicketIdResponse | undefined>(undefined);
  const [comments, setComments] = useState<CommentResponse[]>([]);
  const [isLoadingIssue, setIsLoadingIssue] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(false);

  // Always fetch issue by ticketId from API (like admin route)
  // Wait for auth to finish loading before attempting to fetch
  useEffect(() => {
    const fetchIssue = async () => {
      // Don't fetch if:
      // - Auth is still loading
      // - Not logged in
      // - No access token
      // - No ticketId
      if (authLoading || !isLoggedIn || !accessToken || !ticketId) {
        return;
      }

      try {
        setIsLoadingIssue(true);
        const fetchedIssue = await getIssueByTicketId(accessToken, ticketId);
        setIssue(fetchedIssue);
      } catch (error) {
        console.error('Error fetching issue:', error);
        // Issue will remain undefined, error state will be shown
      } finally {
        setIsLoadingIssue(false);
      }
    };

    fetchIssue();
  }, [accessToken, ticketId, isLoggedIn, authLoading]);

  // Fetch comments when issue is loaded
  useEffect(() => {
    const fetchComments = async () => {
      if (!issue?.id || !isLoggedIn || !accessToken) {
        return;
      }

      try {
        setIsLoadingComments(true);
        const response = await getCommentsByEntity(
          accessToken,
          EntityType.ISSUE,
          issue.id
        );
        setComments(response.comments);
      } catch (error) {
        console.error('Failed to fetch comments:', error);
        // Comments will remain empty on error
      } finally {
        setIsLoadingComments(false);
      }
    };

    fetchComments();
  }, [issue?.id, isLoggedIn, accessToken]);

  if (!isLoggedIn) {
    return (
      <div className={styles.issueDetail}>
        <LoginModal actionText="view issue details" />
      </div>
    );
  }

  // Helper to get created_by ID (handles both string and CreatedByUser object)
  const getCreatedById = (issue: IssueResponse | GetIssueByTicketIdResponse): string => {
    if (typeof issue.created_by === 'string') {
      return issue.created_by;
    }
    return issue.created_by.id;
  };

  // Determine if user can add comments (hide for RESOLVED/DISCARDED)
  const issueStatus = issue?.status || '';
  const shouldHideCommentButton = issueStatus === IssueStatus.RESOLVED || issueStatus === IssueStatus.DISCARDED;
  const canAddComment = isLoggedIn && !shouldHideCommentButton;

  // Show error state only if auth has finished loading, we're logged in, and issue still doesn't exist
  if (!issue && !isLoadingIssue && !authLoading && isLoggedIn) {
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
              onClick={() => navigate('/user/issues')}
            >
              <FiArrowLeft />
              <span>Back to Issues</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.issueDetail}>
      <div className={styles.container}>
        <button 
          className={styles.backButton}
          onClick={() => navigate('/user/issues')}
        >
          <FiArrowLeft />
          <span>Back to Issues</span>
        </button>

        <div className={styles.titleContainer}>
          <h1 className={styles.heading}>Issue Details</h1>
        </div>

        <IssueDetails
          issue={issue}
          isAdmin={false}
          isLoading={isLoadingIssue}
          accessToken={accessToken}
          user={null}
          onBack={() => navigate('/user/issues')}
          comments={comments}
          onCommentsChange={setComments}
          issueCreatedBy={issue ? getCreatedById(issue) : ''}
          canAddComment={canAddComment}
        />
      </div>
    </div>
  );
};

IssueDetail.displayName = 'IssueDetail';

