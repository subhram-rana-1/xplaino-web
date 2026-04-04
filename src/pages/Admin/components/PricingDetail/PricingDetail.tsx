import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import styles from './PricingDetail.module.css';
import { getPricingById, deletePricing } from '@/shared/services/pricing.service';
import type { PricingResponse } from '@/shared/types/pricing.types';
import { usePageTitle } from '@/shared/hooks/usePageTitle';
import { useAuth } from '@/shared/hooks/useAuth';
import { Toast } from '@/shared/components/Toast';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { Admin } from '../../Admin';

/**
 * PricingDetail - Read-only pricing details page component
 */
export const PricingDetail: React.FC = () => {
  usePageTitle('Pricing Details – Xplaino Admin');
  const { pricingId } = useParams<{ pricingId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { accessToken } = useAuth();

  // Get pricing data from navigation state
  const pricingFromState = (location.state as { pricing?: PricingResponse })?.pricing;

  const [pricing, setPricing] = useState<PricingResponse | null>(pricingFromState || null);
  const [isLoading, setIsLoading] = useState(!pricingFromState);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [toast, setToast] = useState<{ message: string; type?: 'success' | 'error' } | null>(null);

  // Fetch pricing if not in state
  useEffect(() => {
    const fetchPricing = async () => {
      if (!accessToken || !pricingId || pricingFromState) return;

      try {
        setIsLoading(true);
        const fetchedPricing = await getPricingById(accessToken, pricingId);
        setPricing(fetchedPricing);
      } catch (error) {
        console.error('Error fetching pricing:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to load pricing';
        setToast({ message: errorMessage, type: 'error' });
      } finally {
        setIsLoading(false);
      }
    };

    fetchPricing();
  }, [accessToken, pricingId, pricingFromState]);

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

  const handleEdit = () => {
    navigate(`/admin/pricing/${pricingId}/edit`, { state: { pricing } });
  };

  const handleDelete = async () => {
    if (!accessToken || !pricingId || !pricing) return;

    setIsDeleting(true);

    try {
      await deletePricing(accessToken, pricingId);
      setToast({ message: `Pricing "${pricing.name}" deleted successfully`, type: 'success' });
      
      // Navigate back to pricing list after a short delay
      setTimeout(() => {
        navigate('/admin/pricing');
      }, 1000);
    } catch (error) {
      console.error('Error deleting pricing:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete pricing';
      setToast({ message: errorMessage, type: 'error' });
      setShowDeleteConfirm(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBack = () => {
    navigate('/admin/pricing');
  };

  if (isLoading) {
    return (
      <Admin>
        <div className={styles.pricingDetail}>
          <div className={styles.loading}>Loading pricing details...</div>
        </div>
      </Admin>
    );
  }

  if (!pricing) {
    return (
      <Admin>
        <div className={styles.pricingDetail}>
          <div className={styles.error}>Pricing not found</div>
          <button className={styles.backButton} onClick={handleBack}>
            ← Back to Pricing List
          </button>
        </div>
      </Admin>
    );
  }

  return (
    <Admin>
      <div className={styles.pricingDetail}>
        <div className={styles.header}>
          <button onClick={handleBack} className={styles.backButton}>
            ← Back
          </button>
          <h1 className={styles.title}>{pricing.name}</h1>
        </div>

        <div className={styles.card}>
          {/* Basic Information */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Basic Information</h2>
            
            <div className={styles.fieldRow}>
              <div className={styles.field}>
                <span className={styles.label}>Name</span>
                <span className={styles.value}>{pricing.name}</span>
              </div>

              <div className={styles.field}>
                <span className={styles.label}>Status</span>
                <span className={`${styles.statusBadge} ${styles[`status${pricing.status}`]}`}>
                  {pricing.status}
                </span>
              </div>
            </div>

            <div className={styles.fieldRow}>
              <div className={styles.field}>
                <span className={styles.label}>Activation</span>
                <span className={styles.value}>{formatDate(pricing.activation)}</span>
              </div>

              <div className={styles.field}>
                <span className={styles.label}>Expiry</span>
                <span className={styles.value}>{formatDate(pricing.expiry)}</span>
              </div>
            </div>

            <div className={styles.fieldRow}>
              <div className={styles.field}>
                <span className={styles.label}>Currency</span>
                <span className={styles.value}>{pricing.currency}</span>
              </div>
            </div>

            <div className={styles.fieldRow}>
              <div className={styles.fieldFull}>
                <span className={styles.label}>Description</span>
                <span className={styles.value}>{pricing.description}</span>
              </div>
            </div>

            <div className={styles.fieldRow}>
              <div className={styles.field}>
                <span className={styles.label}>Is Highlighted</span>
                <span className={`${styles.highlightBadge} ${pricing.is_highlighted ? styles.highlightedYes : styles.highlightedNo}`}>
                  {pricing.is_highlighted ? 'Yes' : 'No'}
                </span>
              </div>
            </div>
          </div>

          {/* Pricing Details */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Pricing Details</h2>
            
            <div className={styles.fieldRow}>
              <div className={styles.field}>
                <span className={styles.label}>Monthly Price</span>
                <span className={styles.value}>${pricing.pricing_details.monthly_price}</span>
              </div>

              <div className={styles.field}>
                <span className={styles.label}>Monthly Discount</span>
                <span className={styles.value}>{pricing.pricing_details.monthly_discount.discount_percentage}%</span>
              </div>
            </div>

            <div className={styles.fieldRow}>
              <div className={styles.field}>
                <span className={styles.label}>Monthly Discount Valid Till</span>
                <span className={styles.value}>{formatDate(pricing.pricing_details.monthly_discount.discount_valid_till)}</span>
              </div>
            </div>

            <div className={styles.fieldRow}>
              <div className={styles.field}>
                <span className={styles.label}>Yearly Pricing Enabled</span>
                <span className={styles.value}>{pricing.pricing_details.is_yearly_enabled ? 'Yes' : 'No'}</span>
              </div>
            </div>

            {pricing.pricing_details.is_yearly_enabled && pricing.pricing_details.yearly_discount && (
              <>
                <div className={styles.fieldRow}>
                  <div className={styles.field}>
                    <span className={styles.label}>Yearly Discount</span>
                    <span className={styles.value}>{pricing.pricing_details.yearly_discount.discount_percentage}%</span>
                  </div>

                  <div className={styles.field}>
                    <span className={styles.label}>Yearly Discount Valid Till</span>
                    <span className={styles.value}>{formatDate(pricing.pricing_details.yearly_discount.discount_valid_till)}</span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Features */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Features</h2>
            
            {pricing.features.length === 0 ? (
              <div className={styles.emptyFeatures}>No features configured</div>
            ) : (
              <div className={styles.featuresList}>
                {pricing.features.map((feature, index) => (
                  <div key={index} className={styles.featureItem}>
                    <div className={styles.featureHeader}>
                      <span className={styles.featureName}>{feature.name}</span>
                      <span className={`${styles.featureStatus} ${feature.is_allowed ? styles.featureAllowed : styles.featureNotAllowed}`}>
                        {feature.is_allowed ? 'Allowed' : 'Not Allowed'}
                      </span>
                    </div>
                    {feature.description && (
                      <div className={styles.featureDescription}>
                        {feature.description}
                      </div>
                    )}
                    {feature.is_allowed && (
                      <div className={styles.featureDetails}>
                        <span className={styles.featureLabel}>Limit:</span>
                        <span className={styles.featureValue}>
                          {feature.max_allowed_type === 'UNLIMITED' 
                            ? 'Unlimited' 
                            : `${feature.max_allowed_count} (Fixed)`}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Metadata */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Metadata</h2>
            
            <div className={styles.fieldRow}>
              <div className={styles.field}>
                <span className={styles.label}>Created At</span>
                <span className={styles.value}>{formatDate(pricing.created_at)}</span>
              </div>

              <div className={styles.field}>
                <span className={styles.label}>Updated At</span>
                <span className={styles.value}>{formatDate(pricing.updated_at)}</span>
              </div>
            </div>

            <div className={styles.fieldRow}>
              <div className={styles.field}>
                <span className={styles.label}>Created By</span>
                <span className={styles.value}>{pricing.created_by.name}</span>
              </div>

              <div className={styles.field}>
                <span className={styles.label}>Creator Role</span>
                <span className={styles.value}>{pricing.created_by.role || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className={styles.actions}>
            <button
              className={styles.deleteButton}
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
            <button
              className={styles.editButton}
              onClick={handleEdit}
              disabled={isDeleting}
            >
              Edit
            </button>
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

        {/* Toast Notification */}
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </div>
    </Admin>
  );
};

PricingDetail.displayName = 'PricingDetail';
