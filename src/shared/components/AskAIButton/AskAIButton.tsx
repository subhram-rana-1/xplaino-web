import React, { useState, useRef, useEffect, useCallback } from 'react';
import styles from './AskAIButton.module.css';

export interface AskAIButtonProps {
  /** Callback when an option is selected */
  onOptionSelect: (option: string) => void;
  /** Optional className for the button container */
  className?: string;
  /** Optional callback when button is clicked, return false to prevent dropdown from opening */
  onButtonClick?: () => boolean;
}

const OPTIONS = ['Short summary', 'Descriptive note', 'I will ask'];

/**
 * AskAIButton - Pill-shaped button with dropdown menu
 * 
 * @returns JSX element
 */
export const AskAIButton: React.FC<AskAIButtonProps> = ({
  onOptionSelect,
  className = '',
  onButtonClick,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleClose = useCallback(() => {
    if (isOpen && !isClosing) {
      setIsClosing(true);
      setTimeout(() => {
        setIsOpen(false);
        setIsClosing(false);
      }, 200); // Match animation duration
    }
  }, [isOpen, isClosing]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!dropdownRef.current || !event.target) {
        return;
      }
      
      const target = event.target as Node;
      if (!dropdownRef.current.contains(target)) {
        handleClose();
      }
    };

    if (isOpen) {
      const timeoutId = setTimeout(() => {
        document.addEventListener('click', handleClickOutside, false);
      }, 10);
      
      return () => {
        clearTimeout(timeoutId);
        document.removeEventListener('click', handleClickOutside, false);
      };
    }

    return undefined;
  }, [isOpen, isClosing, handleClose]);

  const handleOptionClick = (option: string) => {
    handleClose();
    onOptionSelect(option);
  };

  const handleButtonClick = () => {
    // Call onButtonClick callback if provided
    if (onButtonClick) {
      const shouldOpenDropdown = onButtonClick();
      if (!shouldOpenDropdown) {
        return; // Don't open dropdown
      }
    }
    if (isOpen) {
      handleClose();
    } else {
      setIsOpen(true);
      setIsClosing(false);
    }
  };

  return (
    <div className={`${styles.container} ${className}`} ref={dropdownRef}>
      <button
        type="button"
        className={styles.button}
        onClick={handleButtonClick}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        Ask AI
      </button>
      {(isOpen || isClosing) && (
        <div className={`${styles.dropdown} ${isClosing ? styles.dropdownClosing : ''}`}>
          {OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              className={styles.dropdownItem}
              onClick={() => handleOptionClick(option)}
            >
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

AskAIButton.displayName = 'AskAIButton';

