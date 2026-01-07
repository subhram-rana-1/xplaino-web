import React, { useState } from 'react';
import styles from './CreateCouponModal.module.css';
import { createCoupon } from '@/shared/services/coupon.service';
import type { CreateCouponRequest, CouponStatus } from '@/shared/types/coupon.types';
import { DropdownIcon } from '@/shared/components/DropdownIcon';

interface CreateCouponModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  accessToken: string | null;
}

/**
 * CreateCouponModal - Modal for creating a new coupon
 * 
 * @returns JSX element
 */
export const CreateCouponModal: React.FC<CreateCouponModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  accessToken,
}) => {
  const [formData, setFormData] = useState<CreateCouponRequest>({
    code: '',
    name: '',
    description: '',
    discount: 0,
    activation: '',
    expiry: '',
    status: 'ENABLED',
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

  const handleChange = (field: keyof CreateCouponRequest, value: string | number | CouponStatus) => {
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

    if (!formData.code.trim()) {
      newErrors.code = 'Coupon code is required';
    } else if (formData.code.length > 30) {
      newErrors.code = 'Coupon code must be 30 characters or less';
    } else if (!/^[A-Z0-9_-]+$/i.test(formData.code.trim())) {
      newErrors.code = 'Coupon code can only contain letters, numbers, hyphens, and underscores';
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Coupon name is required';
    } else if (formData.name.length > 100) {
      newErrors.name = 'Coupon name must be 100 characters or less';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length > 1024) {
      newErrors.description = 'Description must be 1024 characters or less';
    }

    if (formData.discount <= 0 || formData.discount > 100) {
      newErrors.discount = 'Discount must be between 0 and 100';
    }

    if (!formData.activation) {
      newErrors.activation = 'Activation date is required';
    }

    if (!formData.expiry) {
      newErrors.expiry = 'Expiry date is required';
    }

    if (formData.activation && formData.expiry) {
      const activationDate = new Date(formData.activation);
      const expiryDate = new Date(formData.expiry);
      if (expiryDate <= activationDate) {
        newErrors.expiry = 'Expiry date must be after activation date';
      }
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
      // Convert datetime-local to ISO format
      const activationISO = new Date(formData.activation).toISOString();
      const expiryISO = new Date(formData.expiry).toISOString();

      const requestData: CreateCouponRequest = {
        code: formData.code.trim().toUpperCase(),
        name: formData.name.trim(),
        description: formData.description.trim(),
        discount: formData.discount,
        activation: activationISO,
        expiry: expiryISO,
        status: formData.status,
      };

      await createCoupon(accessToken, requestData);
      onSuccess();
      handleClose();
    } catch (error) {
      console.error('Error creating coupon:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create coupon';
      setErrors({ submit: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      code: '',
      name: '',
      description: '',
      discount: 0,
      activation: '',
      expiry: '',
      status: 'ENABLED',
    });
    setErrors({});
    setIsStatusDropdownOpen(false);
    onClose();
  };

  const statusOptions: { value: CouponStatus; label: string }[] = [
    { value: 'ENABLED', label: 'Enabled' },
    { value: 'DISABLED', label: 'Disabled' },
  ];

  const selectedStatusLabel = statusOptions.find(
    (opt) => opt.value === formData.status
  )?.label || 'Active';

  // Get current datetime in local format for datetime-local input
  const getCurrentDateTimeLocal = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  return (
    <div className={styles.overlay} onClick={handleClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.title}>Create Coupon</h2>
        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Code field */}
          <div className={styles.fieldGroup}>
            <label htmlFor="code" className={styles.label}>
              Coupon Code <span className={styles.required}>*</span>
            </label>
            <input
              id="code"
              type="text"
              className={`${styles.input} ${errors.code ? styles.inputError : ''}`}
              value={formData.code}
              onChange={(e) => handleChange('code', e.target.value.toUpperCase())}
              placeholder="SAVE20"
              maxLength={30}
              required
            />
            {errors.code && <span className={styles.errorMessage}>{errors.code}</span>}
          </div>

          {/* Name field */}
          <div className={styles.fieldGroup}>
            <label htmlFor="name" className={styles.label}>
              Name <span className={styles.required}>*</span>
            </label>
            <input
              id="name"
              type="text"
              className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Summer Sale 2024"
              maxLength={100}
              required
            />
            {errors.name && <span className={styles.errorMessage}>{errors.name}</span>}
          </div>

          {/* Description field */}
          <div className={styles.fieldGroup}>
            <label htmlFor="description" className={styles.label}>
              Description <span className={styles.required}>*</span>
            </label>
            <textarea
              id="description"
              className={`${styles.textarea} ${errors.description ? styles.inputError : ''}`}
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Get 20% off on all premium plans"
              maxLength={1024}
              rows={3}
              required
            />
            {errors.description && <span className={styles.errorMessage}>{errors.description}</span>}
          </div>

          {/* Discount field */}
          <div className={styles.fieldGroup}>
            <label htmlFor="discount" className={styles.label}>
              Discount (%) <span className={styles.required}>*</span>
            </label>
            <input
              id="discount"
              type="number"
              className={`${styles.input} ${errors.discount ? styles.inputError : ''}`}
              value={formData.discount || ''}
              onChange={(e) => handleChange('discount', parseFloat(e.target.value) || 0)}
              placeholder="20"
              min="0"
              max="100"
              step="0.01"
              required
            />
            {errors.discount && <span className={styles.errorMessage}>{errors.discount}</span>}
          </div>

          {/* Activation and Expiry fields in a row */}
          <div className={styles.dateRow}>
            <div className={styles.fieldGroup}>
              <label htmlFor="activation" className={styles.label}>
                Activation Date <span className={styles.required}>*</span>
              </label>
              <input
                id="activation"
                type="datetime-local"
                className={`${styles.input} ${errors.activation ? styles.inputError : ''}`}
                value={formData.activation}
                onChange={(e) => handleChange('activation', e.target.value)}
                min={getCurrentDateTimeLocal()}
                required
              />
              {errors.activation && <span className={styles.errorMessage}>{errors.activation}</span>}
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="expiry" className={styles.label}>
                Expiry Date <span className={styles.required}>*</span>
              </label>
              <input
                id="expiry"
                type="datetime-local"
                className={`${styles.input} ${errors.expiry ? styles.inputError : ''}`}
                value={formData.expiry}
                onChange={(e) => handleChange('expiry', e.target.value)}
                min={formData.activation || getCurrentDateTimeLocal()}
                required
              />
              {errors.expiry && <span className={styles.errorMessage}>{errors.expiry}</span>}
            </div>
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

CreateCouponModal.displayName = 'CreateCouponModal';

