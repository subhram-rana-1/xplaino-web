import React from 'react';
import styles from './FolderIcon.module.css';

interface FolderIconProps {
  className?: string;
  size?: number;
}

/**
 * FolderIcon - Reusable teal-filled folder icon component
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
    <svg
      className={`${styles.folderIcon} ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      aria-hidden="true"
    >
      <path
        d="M4 5C4 3.89543 4.89543 3 6 3H9.17157C9.70201 3 10.2107 3.21071 10.5858 3.58579L12.4142 5.41421C12.7893 5.78929 13.298 6 13.8284 6H18C19.1046 6 20 6.89543 20 8V19C20 20.1046 19.1046 21 18 21H6C4.89543 21 4 20.1046 4 19V5Z"
        fill="currentColor"
      />
    </svg>
  );
};

FolderIcon.displayName = 'FolderIcon';

