import React from 'react';
import styles from './CommentItem.module.css';
import type { CommentResponse } from '@/shared/types/comments.types';
import { AdminBadge } from './AdminBadge';

interface CommentItemProps {
  comment: CommentResponse;
  isReply?: boolean;
  issueCreatedBy?: string;
}

/**
 * CommentItem - Recursive component to display a comment and its nested replies
 */
export const CommentItem: React.FC<CommentItemProps> = ({ comment, isReply = false, issueCreatedBy }) => {
  const formatDate = (dateString: string): string => {
    try {
      // Parse the date string - API typically returns ISO 8601 format
      // If it ends with Z, it's UTC. If it has timezone offset, parse as-is.
      // If no timezone info, assume it's UTC (common for backend APIs)
      let date: Date;
      if (dateString.endsWith('Z')) {
        // Explicitly UTC
        date = new Date(dateString);
      } else if (dateString.includes('+') || (dateString.includes('-') && dateString.length > 19)) {
        // Has timezone offset (e.g., +05:30 or -08:00)
        date = new Date(dateString);
      } else {
        // No timezone info - assume UTC (append Z)
        // Check if it's ISO format (has T)
        if (dateString.includes('T')) {
          date = new Date(dateString + 'Z');
        } else {
          // Not ISO format, try parsing as-is
          date = new Date(dateString);
        }
      }
      
      const now = new Date();
      const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

      // If date is in the future (due to timezone issues), show "just now"
      if (diffInSeconds < 0) {
        return 'just now';
      }

      // Less than 1 minute
      if (diffInSeconds < 60) {
        return 'just now';
      }

      // Less than 1 hour
      if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        return `${minutes}m ago`;
      }

      // Less than 24 hours
      if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        return `${hours}h ago`;
      }

      // Less than 7 days
      if (diffInSeconds < 604800) {
        const days = Math.floor(diffInSeconds / 86400);
        return `${days}d ago`;
      }

      // More than 7 days - show absolute date
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      });
    } catch {
      return dateString;
    }
  };

  const getInitials = (name: string): string => {
    // Use first letter of name in capital
    if (!name || name.trim().length === 0) {
      return '?';
    }
    return name.trim().charAt(0).toUpperCase();
  };

  const isIssueCreator = issueCreatedBy && comment.created_by.id === issueCreatedBy;
  const avatarClass = isIssueCreator ? styles.avatarYellow : styles.avatarGreen;
  const showAdminBadge = comment.created_by.role === 'ADMIN' || comment.created_by.role === 'SUPER_ADMIN';

  return (
    <div className={`${styles.commentItem} ${isReply ? styles.reply : ''}`}>
      <div className={styles.commentContent}>
        <div className={`${styles.avatar} ${avatarClass}`}>
          {getInitials(comment.created_by.name)}
        </div>
        <div className={styles.commentBody}>
          <div className={styles.commentHeader}>
            <div className={styles.authorWrapper}>
              <span className={styles.author}>{comment.created_by.name || `User ${comment.created_by.id.substring(0, 8)}`}</span>
              {showAdminBadge && comment.created_by.role && (
                <AdminBadge role={comment.created_by.role} />
              )}
            </div>
            <span className={styles.timestamp}>{formatDate(comment.created_at)}</span>
          </div>
          <div className={styles.commentText}>{comment.content}</div>
        </div>
      </div>
      
      {comment.child_comments && comment.child_comments.length > 0 && (
        <div className={styles.replies}>
          {comment.child_comments.map((childComment) => (
            <CommentItem
              key={childComment.id}
              comment={childComment}
              isReply={true}
              issueCreatedBy={issueCreatedBy}
            />
          ))}
        </div>
      )}
    </div>
  );
};

CommentItem.displayName = 'CommentItem';

