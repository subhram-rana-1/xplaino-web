import React from 'react';
import { ChevronDown } from 'lucide-react';
import styles from './DropdownIcon.module.css';

interface DropdownIconProps {
  isOpen?: boolean;
  className?: string;
}

/**
 * DropdownIcon - Reusable dropdown chevron icon component
 * Uses lucide-react ChevronDown icon
 * 
 * @param isOpen - Whether the dropdown is open (rotates icon if true)
 * @param className - Additional CSS classes
 * @returns JSX element
 */
export const DropdownIcon: React.FC<DropdownIconProps> = ({ 
  isOpen = false, 
  className = '' 
}) => {
  return (
    <ChevronDown 
      className={`${styles.dropdownIcon} ${isOpen ? styles.dropdownIconOpen : ''} ${className}`}
      aria-hidden="true"
    />
  );
};

DropdownIcon.displayName = 'DropdownIcon';

