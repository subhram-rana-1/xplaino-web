import React from 'react';
import styles from './LoadingDots.module.css';

export interface LoadingDotsProps {
  /** Optional custom className for styling */
  className?: string;
  /** Size variant: 'small', 'medium', 'large' */
  size?: 'small' | 'medium' | 'large';
  /** Color of dots (defaults to teal) */
  color?: string;
}

/**
 * LoadingDots - Reusable 3-dot loading animation
 * Shows an animated three-dot indicator for loading states
 */
export const LoadingDots: React.FC<LoadingDotsProps> = ({
  className = '',
  size = 'medium',
  color,
}) => {
  const containerClass = `${styles.loadingDots} ${styles[size]} ${className}`;
  const dotStyle = color ? { backgroundColor: color } : undefined;

  return (
    <div className={containerClass}>
      <span className={styles.dot} style={dotStyle}></span>
      <span className={styles.dot} style={dotStyle}></span>
      <span className={styles.dot} style={dotStyle}></span>
    </div>
  );
};

LoadingDots.displayName = 'LoadingDots';
