import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import styles from './OnHoverMessage.module.css';

export interface OnHoverMessageProps {
  /** The message text to display */
  message: string;
  /** Reference to the target element to show tooltip for */
  targetRef: React.RefObject<HTMLElement>;
  /** Position relative to target element */
  position?: 'top' | 'bottom' | 'left' | 'right';
  /** Distance from target element in pixels */
  offset?: number;
  /** Additional CSS class name */
  className?: string;
}

export const OnHoverMessage: React.FC<OnHoverMessageProps> = ({
  message,
  targetRef,
  position = 'top',
  offset = 8,
  className = '',
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Calculate tooltip position
  const updatePosition = useCallback(() => {
    if (!targetRef.current || !tooltipRef.current) return;

    const targetRect = targetRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();

    let top = 0;
    let left = 0;

    switch (position) {
      case 'top':
        top = targetRect.top - tooltipRect.height - offset;
        left = targetRect.left + (targetRect.width / 2);
        break;
      case 'bottom':
        top = targetRect.bottom + offset;
        left = targetRect.left + (targetRect.width / 2);
        break;
      case 'left':
        top = targetRect.top + (targetRect.height / 2);
        left = targetRect.left - tooltipRect.width - offset;
        break;
      case 'right':
        top = targetRect.top + (targetRect.height / 2);
        left = targetRect.right + offset;
        break;
    }

    // Keep tooltip within viewport bounds
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    if (left < 0) {
      left = 8;
    } else if (left + tooltipRect.width > viewportWidth) {
      left = viewportWidth - tooltipRect.width - 8;
    }

    if (top < 0) {
      top = 8;
    } else if (top + tooltipRect.height > viewportHeight) {
      top = viewportHeight - tooltipRect.height - 8;
    }

    setTooltipStyle({
      position: 'fixed',
      top: `${top}px`,
      left: `${left}px`,
    });
  }, [targetRef, position, offset]);

  // Handle mouse enter/leave on target element
  useEffect(() => {
    const targetElement = targetRef.current;
    if (!targetElement) return;

    const updatePositionWithDelay = () => {
      setIsVisible(true);
      // Small delay to ensure tooltip is rendered before calculating position
      setTimeout(() => {
        updatePosition();
      }, 0);
    };

    const handleMouseEnter = () => {
      updatePositionWithDelay();
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
    };

    targetElement.addEventListener('mouseenter', handleMouseEnter);
    targetElement.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      targetElement.removeEventListener('mouseenter', handleMouseEnter);
      targetElement.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [targetRef, position, offset, updatePosition]);

  // Update position on scroll and resize
  useEffect(() => {
    if (!isVisible) return;

    const handleUpdate = () => {
      updatePosition();
    };

    window.addEventListener('scroll', handleUpdate, true);
    window.addEventListener('resize', handleUpdate);

    return () => {
      window.removeEventListener('scroll', handleUpdate, true);
      window.removeEventListener('resize', handleUpdate);
    };
  }, [isVisible, updatePosition]);

  // Recalculate position when tooltip becomes visible
  useEffect(() => {
    if (isVisible && tooltipRef.current) {
      updatePosition();
    }
  }, [isVisible, message, updatePosition]);

  if (!message) {
    return null;
  }

  const tooltipContent = (
    <div
      ref={tooltipRef}
      className={`${styles.onHoverMessage} ${isVisible ? styles.visible : ''} ${styles[position]} ${className}`}
      style={tooltipStyle}
      role="tooltip"
      aria-live="polite"
    >
      {message}
    </div>
  );

  // Render outside using portal to document.body
  return createPortal(tooltipContent, document.body);
};

OnHoverMessage.displayName = 'OnHoverMessage';
