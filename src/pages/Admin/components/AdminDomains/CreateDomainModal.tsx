import React, { useState } from 'react';
import styles from './CreateDomainModal.module.css';
import { createDomain } from '@/shared/services/domain.service';
import type { CreateDomainRequest, DomainStatus } from '@/shared/types/domain.types';
import { DropdownIcon } from '@/shared/components/DropdownIcon';

interface CreateDomainModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  accessToken: string | null;
}

/**
 * CreateDomainModal - Modal for creating a new banned domain
 * 
 * @returns JSX element
 */
export const CreateDomainModal: React.FC<CreateDomainModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  accessToken,
}) => {
  const [formData, setFormData] = useState<CreateDomainRequest>({
    url: '',
    status: 'BANNED',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(`.${styles.dropdownContainer}`)) {
        setIsStatusDropdownOpen(false);
      }
    };

    if (isStatusDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isStatusDropdownOpen, isOpen]);

  if (!isOpen) return null;

  /**
   * Validate domain URL format
   * Accepts: example.com, sub.example.com, www.example.com, example.co.uk, my-domain.com
   * Rejects: http://, https://, paths
   */
  const validateDomainUrl = (url: string): boolean => {
    // Check for http/https
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return false;
    }

    // Check for paths (contains /)
    if (url.includes('/')) {
      return false;
    }

    // Validate domain format using regex
    const domainRegex = /^([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
    return domainRegex.test(url);
  };

  const handleChange = (field: keyof CreateDomainRequest, value: string | DomainStatus) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.url.trim()) {
      newErrors.url = 'Domain URL is required';
    } else if (!validateDomainUrl(formData.url.trim())) {
      newErrors.url = 'Invalid domain format. Domain must not include http/https or paths. Examples: example.com, www.example.com, sub.example.com, example.co.uk';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !accessToken) {
      return;
    }

    setIsSubmitting(true);

    try {
      const requestData: CreateDomainRequest = {
        url: formData.url.trim(),
        status: formData.status,
      };

      await createDomain(accessToken, requestData);
      onSuccess();
      handleClose();
    } catch (error) {
      console.error('Error creating domain:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create domain';
      setErrors({ submit: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      url: '',
      status: 'BANNED',
    });
    setErrors({});
    setIsStatusDropdownOpen(false);
    onClose();
  };

  const statusOptions: { value: DomainStatus; label: string }[] = [
    { value: 'ALLOWED', label: 'Allowed' },
    { value: 'BANNED', label: 'Banned' },
  ];

  const selectedStatusLabel = statusOptions.find(
    (opt) => opt.value === formData.status
  )?.label || 'Banned';

  return (
    <div className={styles.overlay} onClick={handleClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.title}>Add banned domain</h2>
        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Domain URL field */}
          <div className={styles.fieldGroup}>
            <label htmlFor="url" className={styles.label}>
              Domain URL <span className={styles.required}>*</span>
            </label>
            <input
              id="url"
              type="text"
              className={`${styles.input} ${errors.url ? styles.inputError : ''}`}
              value={formData.url}
              onChange={(e) => handleChange('url', e.target.value)}
              placeholder="example.com"
              maxLength={100}
              required
            />
            {errors.url && <span className={styles.errorMessage}>{errors.url}</span>}
          </div>

          {/* Status field */}
          <div className={styles.fieldGroup}>
            <label htmlFor="status" className={styles.label}>
              Status <span className={styles.required}>*</span>
            </label>
            <div className={styles.dropdownContainer}>
              <button
                type="button"
                id="status"
                className={`${styles.dropdownButton} ${errors.status ? styles.inputError : ''} ${isStatusDropdownOpen ? styles.dropdownButtonOpen : ''}`}
                onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                aria-haspopup="listbox"
                aria-expanded={isStatusDropdownOpen}
              >
                <span>{selectedStatusLabel}</span>
                <DropdownIcon isOpen={isStatusDropdownOpen} />
              </button>
              {isStatusDropdownOpen && (
                <div className={styles.dropdownList} role="listbox">
                  {statusOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={`${styles.dropdownOption} ${formData.status === option.value ? styles.dropdownOptionSelected : ''}`}
                      onClick={() => {
                        handleChange('status', option.value);
                        setIsStatusDropdownOpen(false);
                      }}
                      role="option"
                      aria-selected={formData.status === option.value}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {errors.submit && (
            <div className={styles.submitError}>{errors.submit}</div>
          )}

          <div className={styles.buttons}>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

CreateDomainModal.displayName = 'CreateDomainModal';


