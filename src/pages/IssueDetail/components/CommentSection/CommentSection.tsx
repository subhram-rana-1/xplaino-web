import React, { useState } from 'react';
import styles from './CommentSection.module.css';
import { CommentInput } from './CommentInput';
import { CommentItem } from './CommentItem';
import { createComment } from '@/shared/services/comments.service';
import { EntityType, CommentVisibility } from '@/shared/types/comments.types';
import type { CommentResponse } from '@/shared/types/comments.types';

interface CommentSectionProps {
  issueId: string;
  accessToken: string;
  comments: CommentResponse[];
  onCommentsChange: (comments: CommentResponse[]) => void;
  issueCreatedBy: string;
  canAddComment?: boolean;
}

/**
 * CommentSection - Main container component for displaying and managing comments
 */
export const CommentSection: React.FC<CommentSectionProps> = ({
  issueId,
  accessToken,
  comments,
  onCommentsChange,
  issueCreatedBy,
  canAddComment = true,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showInput, setShowInput] = useState(false);

  const handleSubmitComment = async (content: string) => {
    setError(null);
    setIsSubmitting(true);

    try {
      const newComment = await createComment(accessToken, {
        entity_type: EntityType.ISSUE,
        entity_id: issueId,
        content,
        visibility: CommentVisibility.PUBLIC,
        parent_comment_id: null,
      });

      // Convert CreateCommentResponse to CommentResponse format
      const commentResponse: CommentResponse = {
        id: newComment.id,
        content: newComment.content,
        visibility: newComment.visibility,
        child_comments: [],
        created_by: newComment.created_by,
        created_at: newComment.created_at,
        updated_at: newComment.updated_at,
      };

      // Prepend new comment to the beginning of the comments array
      onCommentsChange([commentResponse, ...comments]);
      // Hide input after successful submission
      setShowInput(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create comment';
      setError(errorMessage);
      throw err; // Re-throw to let CommentInput handle it
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.commentSection}>
      <div className={styles.header}>
        <h3 className={styles.sectionTitle}>Comments</h3>
        {canAddComment && !showInput && (
          <button
            className={styles.addCommentButton}
            onClick={() => setShowInput(true)}
          >
            + Add comment
          </button>
        )}
      </div>
      
      {canAddComment && showInput && (
        <div className={styles.inputContainer}>
          <CommentInput
            onSubmit={handleSubmitComment}
            isLoading={isSubmitting}
            onCancel={() => setShowInput(false)}
          />
        </div>
      )}

      {error && (
        <div className={styles.errorMessage}>
          {error}
        </div>
      )}

      <div className={styles.commentsList}>
        {comments.length === 0 ? (
          <div className={styles.emptyState}>
            <p className={styles.emptyText}>No comments yet. Be the first to comment!</p>
          </div>
        ) : (
          comments.map((comment) => (
            <CommentItem 
              key={comment.id} 
              comment={comment} 
              issueCreatedBy={issueCreatedBy}
            />
          ))
        )}
      </div>
    </div>
  );
};

CommentSection.displayName = 'CommentSection';

