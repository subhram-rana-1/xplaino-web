import React, { useState, useRef, useEffect } from 'react';
import styles from './LanguageDropdown.module.css';

export interface LanguageDropdownOption {
  value: string;
  label: string;
}

export interface LanguageDropdownProps {
  options: LanguageDropdownOption[];
  value: string | null;
  onChange: (value: string | null) => void;
  placeholder?: string;
}

/**
 * LanguageDropdown - Custom dropdown component matching chrome extension design
 */
export const LanguageDropdown: React.FC<LanguageDropdownProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select language',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

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

  const handleSelect = (optionValue: string, event: React.MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();
    onChange(optionValue || null);
    setIsOpen(false);
  };

  const toggleDropdown = () => {
    if (!isOpen) {
      setIsAnimating(true);
      // Small delay to ensure the element is rendered before animation starts
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsOpen(true);
        });
      });
    } else {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    if (!isOpen && isAnimating) {
      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, 300); // Match animation duration
      return () => clearTimeout(timer);
    }
  }, [isOpen, isAnimating]);

  return (
    <div className={styles.dropdownContainer} ref={dropdownRef}>
      <div className={styles.dropdown}>
        <button
          type="button"
          className={`${styles.dropdownButton} ${isOpen ? styles.open : ''}`}
          onMouseDown={(e) => {
            e.stopPropagation();
          }}
          onClick={(e) => {
            e.stopPropagation();
            toggleDropdown();
          }}
        >
          <span className={styles.dropdownValue}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <svg
            className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
        {(isOpen || isAnimating) && (
          <div className={`${styles.dropdownMenu} ${isOpen ? styles.dropdownMenuOpen : styles.dropdownMenuClosed}`}>
            {options.map((option) => {
              const isSelected = value === option.value;
              return (
                <div
                  key={option.value}
                  className={`${styles.dropdownItem} ${isSelected ? styles.selected : ''}`}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    handleSelect(option.value, e);
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  {option.label}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

LanguageDropdown.displayName = 'LanguageDropdown';



