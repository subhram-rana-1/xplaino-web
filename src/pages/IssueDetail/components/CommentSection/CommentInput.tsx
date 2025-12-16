import React, { useState } from 'react';
import styles from './CommentInput.module.css';

interface CommentInputProps {
  onSubmit: (content: string) => Promise<void>;
  isLoading?: boolean;
  onCancel?: () => void;
}

const MAX_LENGTH = 1000;

/**
 * CommentInput - Input component for creating new comments
 */
export const CommentInput: React.FC<CommentInputProps> = ({ onSubmit, isLoading = false, onCancel }) => {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedContent = content.trim();
    if (!trimmedContent || trimmedContent.length > MAX_LENGTH || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(trimmedContent);
      setContent('');
    } catch (error) {
      console.error('Failed to submit comment:', error);
      // Error handling is done by parent component
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    if (newContent.length <= MAX_LENGTH) {
      setContent(newContent);
    }
  };

  const remainingChars = MAX_LENGTH - content.length;
  const canSubmit = content.trim().length > 0 && content.length <= MAX_LENGTH && !isSubmitting && !isLoading;

  return (
    <form onSubmit={handleSubmit} className={styles.commentInputForm}>
      <div className={styles.inputWrapper}>
        <textarea
          className={styles.textarea}
          placeholder="Add a comment..."
          value={content}
          onChange={handleChange}
          rows={3}
          maxLength={MAX_LENGTH}
          disabled={isSubmitting || isLoading}
        />
        <div className={styles.footer}>
          <span className={`${styles.charCount} ${remainingChars < 100 ? styles.charCountWarning : ''}`}>
            {content.length}/{MAX_LENGTH}
          </span>
          <div className={styles.buttonGroup}>
            {onCancel && (
              <button
                type="button"
                className={styles.cancelButton}
                onClick={onCancel}
                disabled={isSubmitting || isLoading}
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              className={styles.submitButton}
              disabled={!canSubmit}
            >
              {isSubmitting || isLoading ? 'Posting...' : 'Post'}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
};

CommentInput.displayName = 'CommentInput';

