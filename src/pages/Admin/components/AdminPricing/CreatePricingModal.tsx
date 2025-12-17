import React, { useState } from 'react';
import styles from './CreatePricingModal.module.css';
import { createPricing } from '@/shared/services/pricing.service';
import type { CreatePricingRequest } from '@/shared/types/pricing.types';
import { DropdownIcon } from '@/shared/components/DropdownIcon';

interface CreatePricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  accessToken: string | null;
}

/**
 * CreatePricingModal - Modal for creating a new pricing plan
 * 
 * @returns JSX element
 */
export const CreatePricingModal: React.FC<CreatePricingModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  accessToken,
}) => {
  const [formData, setFormData] = useState<CreatePricingRequest>({
    name: '',
    recurring_period: 'MONTH',
    recurring_period_count: 1,
    activation: '',
    expiry: '',
    status: 'DISABLED',
    features: '',
  });
  const [activationDate, setActivationDate] = useState('');
  const [activationTime, setActivationTime] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [expiryTime, setExpiryTime] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRecurringPeriodDropdownOpen, setIsRecurringPeriodDropdownOpen] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);

  // Close dropdowns when clicking outside
  React.useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(`.${styles.dropdownContainer}`)) {
        setIsRecurringPeriodDropdownOpen(false);
        setIsStatusDropdownOpen(false);
      }
    };

    if (isRecurringPeriodDropdownOpen || isStatusDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isRecurringPeriodDropdownOpen, isStatusDropdownOpen, isOpen]);

  if (!isOpen) return null;

  const handleChange = (field: keyof CreatePricingRequest, value: string | number) => {
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

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.length > 30) {
      newErrors.name = 'Name must be 30 characters or less';
    }

    if (formData.recurring_period_count <= 0) {
      newErrors.recurring_period_count = 'Recurring period count must be greater than 0';
    }

    if (!activationDate) {
      newErrors.activationDate = 'Activation date is required';
    }

    if (!activationTime) {
      newErrors.activationTime = 'Activation time is required';
    }

    if (!expiryDate) {
      newErrors.expiryDate = 'Expiry date is required';
    }

    if (!expiryTime) {
      newErrors.expiryTime = 'Expiry time is required';
    }

    if (activationDate && activationTime && expiryDate && expiryTime) {
      const activationDateTime = new Date(`${activationDate}T${activationTime}`);
      const expiryDateTime = new Date(`${expiryDate}T${expiryTime}`);
      if (expiryDateTime <= activationDateTime) {
        newErrors.expiryDate = 'Expiry must be after activation';
      }
    }

    if (!formData.features.trim()) {
      newErrors.features = 'Features are required';
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
      // Combine date and time into ISO format
      const activationISO = new Date(`${activationDate}T${activationTime}`).toISOString();
      const expiryISO = new Date(`${expiryDate}T${expiryTime}`).toISOString();

      const requestData: CreatePricingRequest = {
        ...formData,
        activation: activationISO,
        expiry: expiryISO,
      };

      await createPricing(accessToken, requestData);
      onSuccess();
      handleClose();
    } catch (error) {
      console.error('Error creating pricing:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create pricing';
      setErrors({ submit: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      recurring_period: 'MONTH',
      recurring_period_count: 1,
      activation: '',
      expiry: '',
      status: 'DISABLED',
      features: '',
    });
    setActivationDate('');
    setActivationTime('');
    setExpiryDate('');
    setExpiryTime('');
    setErrors({});
    setIsRecurringPeriodDropdownOpen(false);
    setIsStatusDropdownOpen(false);
    onClose();
  };

  // Get current date in local format for date input
  const getCurrentDate = (): string => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Get current time in local format for time input
  const getCurrentTime = (): string => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const recurringPeriodOptions: { value: 'MONTH' | 'YEAR'; label: string }[] = [
    { value: 'MONTH', label: 'Month' },
    { value: 'YEAR', label: 'Year' },
  ];

  const statusOptions: { value: 'ENABLED' | 'DISABLED'; label: string }[] = [
    { value: 'DISABLED', label: 'Disabled' },
    { value: 'ENABLED', label: 'Enabled' },
  ];

  const selectedRecurringPeriodLabel = recurringPeriodOptions.find(
    (opt) => opt.value === formData.recurring_period
  )?.label || 'Month';

  const selectedStatusLabel = statusOptions.find(
    (opt) => opt.value === formData.status
  )?.label || 'Disabled';

  return (
    <div className={styles.overlay} onClick={handleClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.title}>Add pricing</h2>
        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Name field - full width */}
          <div className={styles.fieldGroup}>
            <label htmlFor="name" className={styles.label}>
              name <span className={styles.required}>*</span>
            </label>
            <input
              id="name"
              type="text"
              className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Enter pricing name"
              maxLength={30}
              required
            />
            {errors.name && <span className={styles.errorMessage}>{errors.name}</span>}
          </div>

          {/* First row: Recurring period, Recurring period count, Status */}
          <div className={styles.row}>
            <div className={styles.fieldGroup}>
              <label htmlFor="recurring_period" className={styles.label}>
                recurring period <span className={styles.required}>*</span>
              </label>
              <div className={styles.dropdownContainer}>
                <button
                  type="button"
                  id="recurring_period"
                  className={`${styles.dropdownButton} ${errors.recurring_period ? styles.inputError : ''} ${isRecurringPeriodDropdownOpen ? styles.dropdownButtonOpen : ''}`}
                  onClick={() => {
                    setIsRecurringPeriodDropdownOpen(!isRecurringPeriodDropdownOpen);
                    setIsStatusDropdownOpen(false);
                  }}
                  aria-haspopup="listbox"
                  aria-expanded={isRecurringPeriodDropdownOpen}
                >
                  <span>{selectedRecurringPeriodLabel}</span>
                  <DropdownIcon isOpen={isRecurringPeriodDropdownOpen} />
                </button>
                {isRecurringPeriodDropdownOpen && (
                  <div className={styles.dropdownList} role="listbox">
                    {recurringPeriodOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        className={`${styles.dropdownOption} ${formData.recurring_period === option.value ? styles.dropdownOptionSelected : ''}`}
                        onClick={() => {
                          handleChange('recurring_period', option.value);
                          setIsRecurringPeriodDropdownOpen(false);
                        }}
                        role="option"
                        aria-selected={formData.recurring_period === option.value}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="recurring_period_count" className={styles.label}>
                recurring period count <span className={styles.required}>*</span>
              </label>
              <input
                id="recurring_period_count"
                type="number"
                className={`${styles.input} ${errors.recurring_period_count ? styles.inputError : ''}`}
                value={formData.recurring_period_count}
                onChange={(e) => handleChange('recurring_period_count', parseInt(e.target.value) || 0)}
                placeholder="Count"
                min="1"
                required
              />
              {errors.recurring_period_count && (
                <span className={styles.errorMessage}>{errors.recurring_period_count}</span>
              )}
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="status" className={styles.label}>
                status <span className={styles.required}>*</span>
              </label>
              <div className={styles.dropdownContainer}>
                <button
                  type="button"
                  id="status"
                  className={`${styles.dropdownButton} ${errors.status ? styles.inputError : ''} ${isStatusDropdownOpen ? styles.dropdownButtonOpen : ''}`}
                  onClick={() => {
                    setIsStatusDropdownOpen(!isStatusDropdownOpen);
                    setIsRecurringPeriodDropdownOpen(false);
                  }}
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
          </div>

          {/* Second row: Activation date, Activation time, Expiry date, Expiry time */}
          <div className={styles.rowFour}>
            <div className={styles.fieldGroup}>
              <label htmlFor="activation_date" className={styles.label}>
                activation date <span className={styles.required}>*</span>
              </label>
              <input
                id="activation_date"
                type="date"
                className={`${styles.input} ${errors.activationDate ? styles.inputError : ''}`}
                value={activationDate}
                onChange={(e) => {
                  setActivationDate(e.target.value);
                  if (errors.activationDate) {
                    setErrors((prev) => {
                      const newErrors = { ...prev };
                      delete newErrors.activationDate;
                      return newErrors;
                    });
                  }
                }}
                min={getCurrentDate()}
                required
              />
              {errors.activationDate && <span className={styles.errorMessage}>{errors.activationDate}</span>}
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="activation_time" className={styles.label}>
                activation time <span className={styles.required}>*</span>
              </label>
              <input
                id="activation_time"
                type="time"
                className={`${styles.input} ${errors.activationTime ? styles.inputError : ''}`}
                value={activationTime}
                onChange={(e) => {
                  setActivationTime(e.target.value);
                  if (errors.activationTime) {
                    setErrors((prev) => {
                      const newErrors = { ...prev };
                      delete newErrors.activationTime;
                      return newErrors;
                    });
                  }
                }}
                required
              />
              {errors.activationTime && <span className={styles.errorMessage}>{errors.activationTime}</span>}
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="expiry_date" className={styles.label}>
                expiry date <span className={styles.required}>*</span>
              </label>
              <input
                id="expiry_date"
                type="date"
                className={`${styles.input} ${errors.expiryDate ? styles.inputError : ''}`}
                value={expiryDate}
                onChange={(e) => {
                  setExpiryDate(e.target.value);
                  if (errors.expiryDate) {
                    setErrors((prev) => {
                      const newErrors = { ...prev };
                      delete newErrors.expiryDate;
                      return newErrors;
                    });
                  }
                }}
                min={activationDate || getCurrentDate()}
                required
              />
              {errors.expiryDate && <span className={styles.errorMessage}>{errors.expiryDate}</span>}
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="expiry_time" className={styles.label}>
                expiry time <span className={styles.required}>*</span>
              </label>
              <input
                id="expiry_time"
                type="time"
                className={`${styles.input} ${errors.expiryTime ? styles.inputError : ''}`}
                value={expiryTime}
                onChange={(e) => {
                  setExpiryTime(e.target.value);
                  if (errors.expiryTime) {
                    setErrors((prev) => {
                      const newErrors = { ...prev };
                      delete newErrors.expiryTime;
                      return newErrors;
                    });
                  }
                }}
                required
              />
              {errors.expiryTime && <span className={styles.errorMessage}>{errors.expiryTime}</span>}
            </div>
          </div>

          {/* Features textarea - full width */}
          <div className={styles.fieldGroup}>
            <label htmlFor="features" className={styles.label}>
              features <span className={styles.required}>*</span>
            </label>
            <textarea
              id="features"
              className={`${styles.textarea} ${errors.features ? styles.inputError : ''}`}
              value={formData.features}
              onChange={(e) => handleChange('features', e.target.value)}
              placeholder="Enter features (one per line or comma-separated)"
              rows={6}
              required
            />
            {errors.features && <span className={styles.errorMessage}>{errors.features}</span>}
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

CreatePricingModal.displayName = 'CreatePricingModal';

