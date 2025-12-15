import React from 'react';
import { FiFolder } from 'react-icons/fi';
import styles from './FolderIcon.module.css';

interface FolderIconProps {
  className?: string;
  size?: number;
}

/**
 * FolderIcon - Reusable folder icon component
 * 
 * @param className - Additional CSS classes
 * @param size - Icon size in pixels
 * @returns JSX element
 */
export const FolderIcon: React.FC<FolderIconProps> = ({
  className = '',
  size = 24,
}) => {
  return (
    <FiFolder
      className={`${styles.folderIcon} ${className}`}
      size={size}
      aria-hidden="true"
    />
  );
};

FolderIcon.displayName = 'FolderIcon';

