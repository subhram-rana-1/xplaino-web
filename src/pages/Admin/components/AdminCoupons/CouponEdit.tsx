import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { FiRefreshCw } from 'react-icons/fi';
import styles from './CouponEdit.module.css';
import { updateCoupon, getCouponById } from '@/shared/services/coupon.service';
import type { CouponResponse, UpdateCouponRequest, CouponStatus } from '@/shared/types/coupon.types';
import { useAuth } from '@/shared/hooks/useAuth';
import { Toast } from '@/shared/components/Toast';
import { DropdownIcon } from '@/shared/components/DropdownIcon';

/**
 * CouponEdit - Edit coupon page component
 * Shows coupon details in view mode, allows editing when fields are changed
 */
export const CouponEdit: React.FC = () => {
  const { couponId } = useParams<{ couponId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { accessToken } = useAuth();

  // Get coupon data from navigation state
  const couponFromState = (location.state as { coupon?: CouponResponse })?.coupon;

  const [coupon, setCoupon] = useState<CouponResponse | null>(couponFromState || null);
  const [isLoading, setIsLoading] = useState(!couponFromState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type?: 'success' | 'error' } | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    discount: 0,
    activation: '',
    expiry: '',
    status: 'ENABLED' as CouponStatus,
    is_highlighted: false,
  });
  // Store original form values to compare for changes
  const [originalFormData, setOriginalFormData] = useState({
    code: '',
    name: '',
    description: '',
    discount: 0,
    activation: '',
    expiry: '',
    status: 'ENABLED' as CouponStatus,
    is_highlighted: false,
  });
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);

  // Fetch coupon if not in state
  useEffect(() => {
    const fetchCoupon = async () => {
      if (!accessToken || !couponId || couponFromState) return;

      try {
        setIsLoading(true);
        const fetchedCoupon = await getCouponById(accessToken, couponId);
        setCoupon(fetchedCoupon);
      } catch (error) {
        console.error('Error fetching coupon:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to load coupon';
        setToast({ message: errorMessage, type: 'error' });
      } finally {
        setIsLoading(false);
      }
    };

    fetchCoupon();
  }, [accessToken, couponId, couponFromState]);

  // Initialize form data from coupon
  useEffect(() => {
    if (coupon) {
      // Convert ISO dates to datetime-local format
      const activationDate = new Date(coupon.activation);
      const expiryDate = new Date(coupon.expiry);
      
      const activationLocal = new Date(activationDate.getTime() - activationDate.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
      const expiryLocal = new Date(expiryDate.getTime() - expiryDate.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);

      const initialFormData = {
        code: coupon.code,
        name: coupon.name,
        description: coupon.description,
        discount: coupon.discount,
        activation: activationLocal,
        expiry: expiryLocal,
        status: coupon.status as CouponStatus,
        is_highlighted: coupon.is_highlighted,
      };

      setFormData(initialFormData);
      setOriginalFormData(initialFormData);
    }
  }, [coupon]);

  // Close dropdown when clicking outside
  useEffect(() => {
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
  }, [isStatusDropdownOpen]);

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  const handleChange = (field: keyof typeof formData, value: string | number | boolean | CouponStatus) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleStatusChange = (value: CouponStatus) => {
    setFormData({ ...formData, status: value });
    setIsStatusDropdownOpen(false);
  };

  // Check if form has changes
  const hasChanges = 
    formData.code !== originalFormData.code ||
    formData.name !== originalFormData.name ||
    formData.description !== originalFormData.description ||
    formData.discount !== originalFormData.discount ||
    formData.activation !== originalFormData.activation ||
    formData.expiry !== originalFormData.expiry ||
    formData.status !== originalFormData.status ||
    formData.is_highlighted !== originalFormData.is_highlighted;

  const validateForm = (): boolean => {
    if (formData.code && formData.code.length > 30) {
      setToast({ message: 'Coupon code must be 30 characters or less', type: 'error' });
      return false;
    }
    if (formData.name && formData.name.length > 100) {
      setToast({ message: 'Coupon name must be 100 characters or less', type: 'error' });
      return false;
    }
    if (formData.description && formData.description.length > 1024) {
      setToast({ message: 'Description must be 1024 characters or less', type: 'error' });
      return false;
    }
    if (formData.discount !== undefined && (formData.discount <= 0 || formData.discount > 100)) {
      setToast({ message: 'Discount must be between 0 and 100', type: 'error' });
      return false;
    }
    if (formData.activation && formData.expiry) {
      const activationDate = new Date(formData.activation);
      const expiryDate = new Date(formData.expiry);
      if (expiryDate <= activationDate) {
        setToast({ message: 'Expiry date must be after activation date', type: 'error' });
        return false;
      }
    }
    return true;
  };

  const handleUpdate = async () => {
    if (!accessToken || !couponId || !coupon) return;

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const updateData: UpdateCouponRequest = {};

      // Only include fields that have changed
      if (formData.code !== originalFormData.code) {
        updateData.code = formData.code.trim().toUpperCase();
      }

      if (formData.name !== originalFormData.name) {
        updateData.name = formData.name.trim();
      }

      if (formData.description !== originalFormData.description) {
        updateData.description = formData.description.trim();
      }

      if (formData.discount !== originalFormData.discount) {
        updateData.discount = formData.discount;
      }

      if (formData.activation !== originalFormData.activation) {
        updateData.activation = new Date(formData.activation).toISOString();
      }

      if (formData.expiry !== originalFormData.expiry) {
        updateData.expiry = new Date(formData.expiry).toISOString();
      }

      if (formData.status !== originalFormData.status) {
        updateData.status = formData.status;
      }

      if (formData.is_highlighted !== originalFormData.is_highlighted) {
        updateData.is_highlighted = formData.is_highlighted;
      }

      // Only call API if there are changes
      if (Object.keys(updateData).length === 0) {
        setToast({ message: 'No changes to update', type: 'error' });
        setIsSubmitting(false);
        return;
      }

      const updatedCoupon = await updateCoupon(accessToken, couponId, updateData);
      setCoupon(updatedCoupon);
      
      // Update form data with response
      const activationDate = new Date(updatedCoupon.activation);
      const expiryDate = new Date(updatedCoupon.expiry);
      const activationLocal = new Date(activationDate.getTime() - activationDate.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
      const expiryLocal = new Date(expiryDate.getTime() - expiryDate.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);

      const newFormData = {
        code: updatedCoupon.code,
        name: updatedCoupon.name,
        description: updatedCoupon.description,
        discount: updatedCoupon.discount,
        activation: activationLocal,
        expiry: expiryLocal,
        status: updatedCoupon.status as CouponStatus,
        is_highlighted: updatedCoupon.is_highlighted,
      };

      setFormData(newFormData);
      setOriginalFormData(newFormData);
      setToast({ message: 'Coupon updated successfully', type: 'success' });
    } catch (error) {
      console.error('Error updating coupon:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update coupon';
      // Check for highlighted intersection error
      if (errorMessage.includes('HIGHLIGHTED_INTERSECTION') || errorMessage.includes('intersecting')) {
        setToast({ message: 'Cannot set status=ENABLED and is_highlighted=True: another ENABLED highlighted coupon has an intersecting activation period', type: 'error' });
      } else {
        setToast({ message: errorMessage, type: 'error' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusOptions: { value: CouponStatus; label: string }[] = [
    { value: 'ENABLED', label: 'Enabled' },
    { value: 'DISABLED', label: 'Disabled' },
  ];

  if (isLoading) {
    return (
      <div className={styles.couponEdit}>
        <div className={styles.loading}>Loading coupon...</div>
      </div>
    );
  }

  if (!coupon) {
    return (
      <div className={styles.couponEdit}>
        <div className={styles.error}>Coupon not found</div>
        <button className={styles.backButton} onClick={() => navigate('/admin/coupon')}>
          Back to Coupons
        </button>
      </div>
    );
  }

  return (
    <div className={styles.couponEdit}>
      <div className={styles.header}>
        <button 
          className={styles.backButton} 
          onClick={() => navigate('/admin/coupon')}
        >
          ← Back to Coupons
        </button>
        <h1 className={styles.title}>Coupon Details</h1>
        <button
          className={styles.refreshButton}
          onClick={async () => {
            if (!accessToken || !couponId) return;
            try {
              setIsLoading(true);
              const fetchedCoupon = await getCouponById(accessToken, couponId);
              setCoupon(fetchedCoupon);
              setToast({ message: 'Coupon refreshed successfully', type: 'success' });
            } catch (error) {
              console.error('Error refreshing coupon:', error);
              const errorMessage = error instanceof Error ? error.message : 'Failed to refresh coupon';
              setToast({ message: errorMessage, type: 'error' });
            } finally {
              setIsLoading(false);
            }
          }}
          disabled={isLoading || isSubmitting}
          title="Refresh coupon details"
        >
          <FiRefreshCw className={isLoading ? styles.spin : ''} />
        </button>
      </div>

      <div className={styles.card}>
        <div className={styles.fieldRow}>
          <div className={styles.field}>
            <span className={styles.label}>Code</span>
            <input
              type="text"
              className={styles.input}
              value={formData.code}
              onChange={(e) => handleChange('code', e.target.value.toUpperCase())}
              maxLength={30}
            />
          </div>
          <div className={styles.field}>
            <span className={styles.label}>Name</span>
            <input
              type="text"
              className={styles.input}
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              maxLength={100}
            />
          </div>
        </div>

        <div className={styles.fieldRow}>
          <div className={styles.field}>
            <span className={styles.label}>Description</span>
            <textarea
              className={styles.textarea}
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              maxLength={1024}
              rows={3}
            />
          </div>
        </div>

        <div className={styles.fieldRow}>
          <div className={styles.field}>
            <span className={styles.label}>Discount (%)</span>
            <input
              type="number"
              className={styles.input}
              value={formData.discount || ''}
              onChange={(e) => handleChange('discount', parseFloat(e.target.value) || 0)}
              min="0"
              max="100"
              step="0.01"
            />
          </div>
          <div className={styles.field}>
            <span className={styles.label}>Status</span>
            <div className={styles.dropdownContainer}>
              <button
                type="button"
                className={`${styles.statusBadgeButton} ${styles[`status${formData.status}`]} ${isStatusDropdownOpen ? styles.statusBadgeButtonOpen : ''}`}
                onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                aria-haspopup="listbox"
                aria-expanded={isStatusDropdownOpen}
              >
                <span>{formData.status === 'ENABLED' ? 'Enabled' : 'Disabled'}</span>
                <DropdownIcon isOpen={isStatusDropdownOpen} />
              </button>
              {isStatusDropdownOpen && (
                <div className={styles.dropdownList} role="listbox">
                  {statusOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={`${styles.dropdownOption} ${formData.status === option.value ? styles.dropdownOptionSelected : ''}`}
                      onClick={() => handleStatusChange(option.value)}
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

        <div className={styles.fieldRow}>
          <div className={styles.field}>
            <span className={styles.label}>Activation Date</span>
            <input
              type="datetime-local"
              className={styles.input}
              value={formData.activation}
              onChange={(e) => handleChange('activation', e.target.value)}
            />
          </div>
          <div className={styles.field}>
            <span className={styles.label}>Expiry Date</span>
            <input
              type="datetime-local"
              className={styles.input}
              value={formData.expiry}
              onChange={(e) => handleChange('expiry', e.target.value)}
              min={formData.activation}
            />
          </div>
        </div>

        <div className={styles.fieldRow}>
          <div className={styles.field}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                className={styles.checkbox}
                checked={formData.is_highlighted}
                onChange={(e) => handleChange('is_highlighted', e.target.checked)}
              />
              <span>Highlighted</span>
            </label>
          </div>
        </div>

        <div className={styles.fieldRow}>
          <div className={styles.field}>
            <span className={styles.label}>Created At</span>
            <span className={styles.value}>{formatDate(coupon.created_at)}</span>
          </div>
          <div className={styles.field}>
            <span className={styles.label}>Updated At</span>
            <span className={styles.value}>{formatDate(coupon.updated_at)}</span>
          </div>
        </div>

        <div className={styles.fieldRow}>
          <div className={styles.field}>
            <span className={styles.label}>Created By</span>
            <span className={styles.value}>{coupon.created_by.name}</span>
          </div>
        </div>

        <div className={styles.actions}>
          <button
            className={styles.updateButton}
            onClick={handleUpdate}
            disabled={!hasChanges || isSubmitting}
          >
            {isSubmitting ? 'Updating...' : 'Update'}
          </button>
        </div>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

CouponEdit.displayName = 'CouponEdit';

