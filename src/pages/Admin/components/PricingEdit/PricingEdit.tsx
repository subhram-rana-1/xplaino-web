import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation, Navigate } from 'react-router-dom';
import styles from './PricingEdit.module.css';
import { updatePricing, deletePricing } from '@/shared/services/pricing.service';
import type { PricingResponse, UpdatePricingRequest } from '@/shared/types/pricing.types';
import { useAuth } from '@/shared/hooks/useAuth';
import { Toast } from '@/shared/components/Toast';
import { DropdownIcon } from '@/shared/components/DropdownIcon';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';

/**
 * PricingEdit - Edit pricing page component
 * Shows pricing details in view mode, allows editing when Edit button is clicked
 */
export const PricingEdit: React.FC = () => {
  const { pricingId } = useParams<{ pricingId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoggedIn, user, accessToken } = useAuth();

  // Get pricing data from navigation state
  const pricingFromState = (location.state as { pricing?: PricingResponse })?.pricing;

  const [pricing, setPricing] = useState<PricingResponse | null>(pricingFromState || null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [toast, setToast] = useState<{ message: string; type?: 'success' | 'error' } | null>(null);

  // Form state for edit mode
  const [formData, setFormData] = useState({
    name: '',
    activationDate: '',
    activationTime: '',
    expiryDate: '',
    expiryTime: '',
    status: 'DISABLED' as 'ENABLED' | 'DISABLED',
  });
  // Store original form values to compare for changes
  const [originalFormData, setOriginalFormData] = useState({
    name: '',
    activationDate: '',
    activationTime: '',
    expiryDate: '',
    expiryTime: '',
    status: 'DISABLED' as 'ENABLED' | 'DISABLED',
  });
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);

  // Redirect non-admin users
  if (!isLoggedIn || (user?.role !== 'ADMIN' && user?.role !== 'SUPER_ADMIN')) {
    return <Navigate to="/" replace />;
  }

  // Initialize form data from pricing (from navigation state)
  useEffect(() => {
    if (pricing) {
      const activationDate = new Date(pricing.activation);
      const expiryDate = new Date(pricing.expiry);

      const initialFormData = {
        name: pricing.name,
        activationDate: activationDate.toISOString().split('T')[0],
        activationTime: activationDate.toTimeString().slice(0, 5),
        expiryDate: expiryDate.toISOString().split('T')[0],
        expiryTime: expiryDate.toTimeString().slice(0, 5),
        status: pricing.status as 'ENABLED' | 'DISABLED',
      };

      setFormData(initialFormData);
      setOriginalFormData(initialFormData);
    }
  }, [pricing]);

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
      return date.toLocaleDateString('en-US', {
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

  const handleEditClick = () => {
    setIsEditMode(true);
  };

  const handleCancelEdit = () => {
    if (pricing) {
      const activationDate = new Date(pricing.activation);
      const expiryDate = new Date(pricing.expiry);

      setFormData({
        name: pricing.name,
        activationDate: activationDate.toISOString().split('T')[0],
        activationTime: activationDate.toTimeString().slice(0, 5),
        expiryDate: expiryDate.toISOString().split('T')[0],
        expiryTime: expiryDate.toTimeString().slice(0, 5),
        status: pricing.status as 'ENABLED' | 'DISABLED',
      });
    }
    setIsEditMode(false);
  };

  const handleUpdate = async () => {
    if (!accessToken || !pricingId || !pricing) return;

    setIsSubmitting(true);

    try {
      const updateData: UpdatePricingRequest = {};

      // Only include fields that have changed (compare with original form values)
      if (formData.name !== originalFormData.name) {
        updateData.name = formData.name;
      }

      // Check if activation date or time changed
      if (formData.activationDate !== originalFormData.activationDate || 
          formData.activationTime !== originalFormData.activationTime) {
        const activationISO = new Date(`${formData.activationDate}T${formData.activationTime}`).toISOString();
        updateData.activation = activationISO;
      }

      // Check if expiry date or time changed
      if (formData.expiryDate !== originalFormData.expiryDate || 
          formData.expiryTime !== originalFormData.expiryTime) {
        const expiryISO = new Date(`${formData.expiryDate}T${formData.expiryTime}`).toISOString();
        updateData.expiry = expiryISO;
      }

      if (formData.status !== originalFormData.status) {
        updateData.status = formData.status;
      }

      // Only call API if there are changes
      if (Object.keys(updateData).length === 0) {
        setToast({ message: 'No changes to update', type: 'error' });
        setIsSubmitting(false);
        return;
      }

      const updatedPricing = await updatePricing(accessToken, pricingId, updateData);
      setPricing(updatedPricing);
      setIsEditMode(false);
      setToast({ message: 'Pricing updated successfully', type: 'success' });
    } catch (error) {
      console.error('Error updating pricing:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update pricing';
      setToast({ message: errorMessage, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!accessToken || !pricingId || !pricing) return;

    setIsDeleting(true);

    try {
      await deletePricing(accessToken, pricingId);
      // Navigate to admin page with success state
      navigate('/admin', {
        state: {
          activeSection: 'pricing',
          toast: {
            message: `Pricing "${pricing.name}" deleted successfully`,
            type: 'success'
          }
        }
      });
    } catch (error) {
      console.error('Error deleting pricing:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete pricing';
      setToast({ message: errorMessage, type: 'error' });
      setShowDeleteConfirm(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const statusOptions: { value: 'ENABLED' | 'DISABLED'; label: string }[] = [
    { value: 'DISABLED', label: 'Disabled' },
    { value: 'ENABLED', label: 'Enabled' },
  ];

  if (!pricing) {
    return (
      <div className={styles.pricingEdit}>
        <div className={styles.error}>Pricing not found</div>
        <button className={styles.backButton} onClick={() => navigate('/admin')}>
          Back to Admin
        </button>
      </div>
    );
  }

  return (
    <div className={styles.pricingEdit}>
      <div className={styles.header}>
        <button className={styles.backButton} onClick={() => navigate('/admin')}>
          ← Back
        </button>
        <h1 className={styles.title}>Pricing Details</h1>
      </div>

      <div className={styles.card}>
        <div className={styles.fieldRow}>
          <div className={styles.field}>
            <span className={styles.label}>Name</span>
            {isEditMode ? (
              <input
                type="text"
                className={styles.input}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                maxLength={30}
              />
            ) : (
              <span className={styles.value}>{pricing.name}</span>
            )}
          </div>
        </div>

        <div className={styles.fieldRow}>
          <div className={styles.field}>
            <span className={styles.label}>Recurring Period</span>
            <span className={styles.value}>{pricing.recurring_period}</span>
          </div>
          <div className={styles.field}>
            <span className={styles.label}>Recurring Period Count</span>
            <span className={styles.value}>{pricing.recurring_period_count}</span>
          </div>
        </div>

        <div className={styles.fieldRow}>
          <div className={styles.field}>
            <span className={styles.label}>Activation</span>
            {isEditMode ? (
              <div className={styles.dateTimeInputs}>
                <input
                  type="date"
                  className={styles.input}
                  value={formData.activationDate}
                  onChange={(e) => setFormData({ ...formData, activationDate: e.target.value })}
                />
                <input
                  type="time"
                  className={styles.input}
                  value={formData.activationTime}
                  onChange={(e) => setFormData({ ...formData, activationTime: e.target.value })}
                />
              </div>
            ) : (
              <span className={styles.value}>{formatDate(pricing.activation)}</span>
            )}
          </div>
          <div className={styles.field}>
            <span className={styles.label}>Expiry</span>
            {isEditMode ? (
              <div className={styles.dateTimeInputs}>
                <input
                  type="date"
                  className={styles.input}
                  value={formData.expiryDate}
                  onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                />
                <input
                  type="time"
                  className={styles.input}
                  value={formData.expiryTime}
                  onChange={(e) => setFormData({ ...formData, expiryTime: e.target.value })}
                />
              </div>
            ) : (
              <span className={styles.value}>{formatDate(pricing.expiry)}</span>
            )}
          </div>
        </div>

        <div className={styles.fieldRow}>
          <div className={styles.field}>
            <span className={styles.label}>Status</span>
            {isEditMode ? (
              <div className={styles.dropdownContainer}>
                <button
                  type="button"
                  className={`${styles.dropdownButton} ${isStatusDropdownOpen ? styles.dropdownButtonOpen : ''}`}
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
                        onClick={() => {
                          setFormData({ ...formData, status: option.value });
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
            ) : (
              <span className={`${styles.statusBadge} ${styles[`status${pricing.status}`]}`}>
                {pricing.status}
              </span>
            )}
          </div>
          <div className={styles.field}>
            <span className={styles.label}>Updated At</span>
            <span className={styles.value}>{formatDate(pricing.updated_at)}</span>
          </div>
        </div>

        <div className={styles.fieldRow}>
          <div className={styles.field}>
            <span className={styles.label}>Created At</span>
            <span className={styles.value}>{formatDate(pricing.created_at)}</span>
          </div>
          <div className={styles.field}>
            <span className={styles.label}>Created By</span>
            <span className={styles.value}>{pricing.created_by.name}</span>
          </div>
        </div>

        <div className={styles.actions}>
          <button
            className={styles.deleteButton}
            onClick={() => setShowDeleteConfirm(true)}
            disabled={isSubmitting || isDeleting}
          >
            Delete
          </button>
          <div className={styles.rightActions}>
            {isEditMode ? (
              <>
                <button
                  className={styles.cancelButton}
                  onClick={handleCancelEdit}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  className={styles.updateButton}
                  onClick={handleUpdate}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Updating...' : 'Update'}
                </button>
              </>
            ) : (
              <button className={styles.editButton} onClick={handleEditClick}>
                Edit
              </button>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete Pricing"
        message={<>Are you sure you want to delete <strong>"{pricing.name}"</strong>? This action cannot be undone.</>}
        confirmText={isDeleting ? 'Deleting...' : 'Delete'}
        cancelText="Cancel"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />

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

PricingEdit.displayName = 'PricingEdit';

