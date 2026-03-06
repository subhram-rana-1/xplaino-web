import React from 'react';
import { Trash2, Folder } from 'lucide-react';
import styles from './ActionIcons.module.css';

export interface ActionIconsProps {
  onDelete: () => void;
  onMove: () => void;
  isVisible: boolean;
  className?: string;
  showMove?: boolean;
}

export const ActionIcons: React.FC<ActionIconsProps> = ({
  onDelete,
  onMove,
  isVisible,
  className = '',
  showMove = true,
}) => {
  return (
    <div className={`${styles.actionIcons} ${isVisible ? styles.visible : styles.hidden} ${className}`}>
      <button
        className={styles.deleteButton}
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        title="Delete"
        aria-label="Delete"
      >
        <Trash2 />
      </button>
      {showMove && (
        <button
          className={styles.moveButton}
          onClick={(e) => {
            e.stopPropagation();
            onMove();
          }}
          title="Move to folder"
          aria-label="Move to folder"
        >
          <Folder />
        </button>
      )}
    </div>
  );
};

ActionIcons.displayName = 'ActionIcons';

