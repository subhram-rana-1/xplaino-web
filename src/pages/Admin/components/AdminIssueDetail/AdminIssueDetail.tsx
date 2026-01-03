import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import styles from './AdminIssueDetail.module.css';
import { useAuth } from '@/shared/hooks/useAuth';
import { IssueStatus } from '@/shared/types/issues.types';
import type { GetIssueByTicketIdResponse } from '@/shared/types/issues.types';
import { updateIssue, getIssueByTicketId } from '@/shared/services/issues.service';
import { getCommentsByEntity } from '@/shared/services/comments.service';
import { EntityType } from '@/shared/types/comments.types';
import type { CommentResponse } from '@/shared/types/comments.types';
import { IssueDetails } from '@/shared/components/IssueDetails';
import { Toast } from '@/shared/components/Toast';

/**
 * AdminIssueDetail - Admin issue detail page component with editable status
 * 
 * @returns JSX element
 */
export const AdminIssueDetail: React.FC = () => {
  const { accessToken, user } = useAuth();
  const navigate = useNavigate();
  const { ticketId } = useParams<{ ticketId: string }>();
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isLoadingIssue, setIsLoadingIssue] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [toast, setToast] = useState<{ message: string; type?: 'success' | 'error' } | null>(null);

  const [issue, setIssue] = useState<GetIssueByTicketIdResponse | undefined>(undefined);
  const [comments, setComments] = useState<CommentResponse[]>([]);
  const [creatorName, setCreatorName] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<IssueStatus | null>(null);

  const originalStatus = issue?.status as IssueStatus | undefined;
  const hasStatusChanged = selectedStatus !== null && selectedStatus !== originalStatus;

  // Always fetch issue by ticket ID from API
  useEffect(() => {
    const fetchIssue = async () => {
      if (!accessToken || !ticketId) {
        return;
      }

      try {
        setIsLoadingIssue(true);
        const fetchedIssue = await getIssueByTicketId(accessToken, ticketId);
        setIssue(fetchedIssue);
        setSelectedStatus(fetchedIssue.status as IssueStatus);
        // Extract creator name directly from the API response
        setCreatorName(fetchedIssue.created_by.name || 'Unknown');
      } catch (error) {
        console.error('Error fetching issue:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to load issue';
        setToast({ message: errorMessage, type: 'error' });
      } finally {
        setIsLoadingIssue(false);
      }
    };

    fetchIssue();
  }, [accessToken, ticketId]);

  // Fetch comments when issue is loaded
  useEffect(() => {
    const fetchComments = async () => {
      if (!issue?.id || !accessToken) {
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
        console.error('Error fetching comments:', error);
        // Don't show error toast for comments, just log it
      } finally {
        setIsLoadingComments(false);
      }
    };

    fetchComments();
  }, [issue?.id, accessToken]);

  // Determine if user can add comments
  // Only Admin, Super Admin, and the ticket creator can add comments
  // Hide comment button if issue is resolved or discarded
  const canAddComment = !!user && !!issue && 
    issue.status !== IssueStatus.RESOLVED &&
    issue.status !== IssueStatus.DISCARDED &&
    (
      user.role === 'ADMIN' ||
      user.role === 'SUPER_ADMIN' ||
      user.id === issue.created_by.id
    );

  if (isLoadingIssue) {
    return (
      <div className={styles.issueDetail}>
        <div className={styles.container}>
          <div className={styles.loading}>Loading issue...</div>
        </div>
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
              onClick={() => navigate('/admin/ticket')}
            >
              <FiArrowLeft />
              <span>Back to Tickets</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleStatusSelect = (status: IssueStatus) => {
    setSelectedStatus(status);
    setIsStatusDropdownOpen(false);
  };

  const handleUpdate = async (status: IssueStatus) => {
    if (!accessToken || !status || !issue || !ticketId) {
      return;
    }

    try {
      setIsUpdating(true);
      await updateIssue(accessToken, issue.id, { status });
      // Refetch issue to get updated data with CreatedByUser objects
      const updatedIssue = await getIssueByTicketId(accessToken, ticketId);
      setIssue(updatedIssue);
      setSelectedStatus(updatedIssue.status as IssueStatus);
      setCreatorName(updatedIssue.created_by.name || 'Unknown');
      setToast({ message: 'Issue status updated successfully', type: 'success' });
    } catch (error) {
      console.error('Failed to update issue:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update issue';
      setToast({ message: errorMessage, type: 'error' });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className={styles.issueDetail}>
      <div className={styles.container}>
        <button 
          className={styles.backButton}
          onClick={() => navigate('/admin/ticket')}
        >
          <FiArrowLeft />
          <span>Back to Tickets</span>
        </button>

        <div className={styles.titleContainer}>
          <h1 className={styles.heading}>Issue Details</h1>
        </div>

        <IssueDetails
          issue={issue}
          isAdmin={true}
          isLoading={isLoadingIssue}
          accessToken={accessToken}
          user={user}
          onBack={() => navigate('/admin/ticket')}
          onStatusUpdate={handleUpdate}
          canEditStatus={true}
          selectedStatus={selectedStatus}
          onStatusSelect={handleStatusSelect}
          isUpdating={isUpdating}
          creatorName={creatorName}
          comments={comments}
          onCommentsChange={setComments}
          issueCreatedBy={issue?.created_by.id || ''}
          canAddComment={canAddComment}
          toast={toast}
          onToastClose={() => setToast(null)}
          isStatusDropdownOpen={isStatusDropdownOpen}
          onStatusDropdownToggle={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
          hasStatusChanged={hasStatusChanged}
        />

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


