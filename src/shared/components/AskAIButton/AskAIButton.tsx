import React, { useState, useRef, useEffect } from 'react';
import styles from './AskAIButton.module.css';

export interface AskAIButtonProps {
  /** Callback when an option is selected */
  onOptionSelect: (option: string) => void;
  /** Optional className for the button container */
  className?: string;
}

const OPTIONS = ['Short summary', 'Descriptive note', 'Ask AI'];

/**
 * AskAIButton - Pill-shaped button with dropdown menu
 * 
 * @returns JSX element
 */
export const AskAIButton: React.FC<AskAIButtonProps> = ({
  onOptionSelect,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!dropdownRef.current || !event.target) {
        return;
      }
      
      const target = event.target as Node;
      if (!dropdownRef.current.contains(target)) {
        setIsOpen(false);
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
  }, [isOpen]);

  const handleOptionClick = (option: string) => {
    setIsOpen(false);
    onOptionSelect(option);
  };

  return (
    <div className={`${styles.container} ${className}`} ref={dropdownRef}>
      <button
        type="button"
        className={styles.button}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        Ask AI
      </button>
      {isOpen && (
        <div className={styles.dropdown}>
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

