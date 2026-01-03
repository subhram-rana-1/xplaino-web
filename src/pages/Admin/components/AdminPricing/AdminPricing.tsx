import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiRefreshCw } from 'react-icons/fi';
import styles from './AdminPricing.module.css';
import { getAllPricings, getLivePricings } from '@/shared/services/pricing.service';
import type { PricingResponse } from '@/shared/types/pricing.types';
import { Toast } from '@/shared/components/Toast';
import { CreatePricingModal } from './CreatePricingModal';

type StatusTab = 'live' | 'all' | 'active' | 'inactive';

interface AdminPricingProps {
  accessToken: string | null;
}

/**
 * AdminPricing - Admin pricing management component
 * 
 * @returns JSX element
 */
export const AdminPricing: React.FC<AdminPricingProps> = ({ accessToken }) => {
  const navigate = useNavigate();
  const [livePricings, setLivePricings] = useState<PricingResponse[]>([]);
  const [allPricings, setAllPricings] = useState<PricingResponse[]>([]);
  const [filteredPricings, setFilteredPricings] = useState<PricingResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusTab, setStatusTab] = useState<StatusTab>('live');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type?: 'success' | 'error' } | null>(null);

  const fetchLivePricings = async () => {
    try {
      const response = await getLivePricings();
      setLivePricings(response.pricings);
    } catch (error) {
      console.error('Error fetching live pricings:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load live pricing plans';
      setToast({ message: errorMessage, type: 'error' });
    }
  };

  const fetchAllPricings = async () => {
    if (!accessToken) {
      return;
    }

    try {
      const response = await getAllPricings(accessToken);
      setAllPricings(response.pricings);
    } catch (error) {
      console.error('Error fetching all pricings:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load all pricing plans';
      setToast({ message: errorMessage, type: 'error' });
    }
  };

  const fetchBothPricings = async () => {
    setIsLoading(true);
    try {
      await Promise.all([fetchLivePricings(), fetchAllPricings()]);
    } finally {
      setIsLoading(false);
    }
  };

  // On mount, if Live tab is selected, fetch both APIs
  useEffect(() => {
    if (statusTab === 'live' && accessToken) {
      fetchBothPricings();
    }
  }, [accessToken]);

  // Filter pricings based on status tab
  useEffect(() => {
    const currentTime = new Date().getTime();

    let filtered: PricingResponse[] = [];

    switch (statusTab) {
      case 'live':
        filtered = livePricings;
        break;
      case 'all':
        filtered = allPricings;
        break;
      case 'active':
        filtered = allPricings.filter((pricing) => {
          const activation = new Date(pricing.activation).getTime();
          const expiry = new Date(pricing.expiry).getTime();
          return activation < currentTime && currentTime < expiry;
        });
        break;
      case 'inactive':
        filtered = allPricings.filter((pricing) => {
          const expiry = new Date(pricing.expiry).getTime();
          return expiry < currentTime;
        });
        break;
    }

    setFilteredPricings(filtered);
  }, [livePricings, allPricings, statusTab]);

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

  const formatPriceDisplay = (pricing: PricingResponse): string => {
    const period = pricing.recurring_period.toLowerCase();
    const amount = pricing.amount;
    const currency = pricing.currency;
    
    // Get currency symbol
    const currencySymbol = currency === 'USD' ? '$' : currency;
    
    if (amount === 0) {
      return `${currencySymbol}0 per month/user`;
    }
    
    if (period === 'year') {
      if (amount >= 1000) {
        const thousands = amount / 1000;
        return `${currencySymbol}${thousands}k per year`;
      }
      return `${currencySymbol}${amount.toLocaleString()} per year`;
    }
    
    return `${currencySymbol}${amount} per month/user`;
  };

  const statusTabs: { value: StatusTab; label: string }[] = [
    { value: 'live', label: 'Live' },
    { value: 'all', label: 'All' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
  ];

  const handleTabClick = (tab: StatusTab) => {
    setStatusTab(tab);
    // No API calls - just switch tabs to show filtered data from existing state
  };

  const handleRefresh = () => {
    // Always refresh both APIs to keep all state variables updated
    fetchBothPricings();
  };

  if (isLoading) {
    return (
      <div className={styles.adminPricing}>
        <div className={styles.loading}>Loading pricing plans...</div>
      </div>
    );
  }

  return (
    <div className={styles.adminPricing}>
      <div className={styles.header}>
        <div className={styles.headerActions}>
          <button
            className={styles.refreshButton}
            onClick={handleRefresh}
            disabled={isLoading}
            title="Refresh pricing plans"
          >
            <FiRefreshCw className={isLoading ? styles.spin : ''} />
          </button>
          <button
            className={styles.addButton}
            onClick={() => setIsModalOpen(true)}
          >
            Add pricing
          </button>
        </div>
      </div>

      <div className={styles.tabs}>
        {statusTabs.map((tab) => (
          <button
            key={tab.value}
            className={`${styles.tab} ${statusTab === tab.value ? styles.tabActive : ''}`}
            onClick={() => handleTabClick(tab.value)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {filteredPricings.length === 0 ? (
        <div className={styles.emptyState}>
          <h2 className={styles.emptyHeading}>No pricing plans found</h2>
          <p className={styles.emptyMessage}>
            {statusTab === 'live' 
              ? 'No live pricing plans available.'
              : `No ${statusTab === 'all' ? '' : statusTab} pricing plans found.`}
          </p>
        </div>
      ) : (
        <div className={styles.pricingList}>
          {filteredPricings.map((pricing) => {
            const activation = new Date(pricing.activation).getTime();
            const expiry = new Date(pricing.expiry).getTime();
            const currentTime = new Date().getTime();
            const isActive = activation < currentTime && currentTime < expiry;
            const isExpired = expiry < currentTime;
            // Live = ENABLED + active date range
            const isLive = pricing.status === 'ENABLED' && isActive;

            // Determine card background class
            let cardClass = styles.pricingCard;
            if (isLive) {
              cardClass = `${styles.pricingCard} ${styles.cardLive}`;
            } else if (isActive) {
              cardClass = `${styles.pricingCard} ${styles.cardActive}`;
            }

            return (
              <div
                key={pricing.id}
                className={cardClass}
                onClick={() => navigate(`/admin/pricing/${pricing.id}`, { state: { pricing } })}
              >
                <div className={styles.cardHeader}>
                  <div>
                    <h2 className={styles.cardTitle}>{pricing.name}</h2>
                    <div className={styles.price}>{formatPriceDisplay(pricing)}</div>
                  </div>
                  <div className={styles.statusBadges}>
                    <span className={`${styles.statusBadge} ${styles[`status${pricing.status}`]}`}>
                      {pricing.status}
                    </span>
                    {isActive && (
                      <span className={`${styles.statusBadge} ${styles.statusActive}`}>
                        Active
                      </span>
                    )}
                    {isExpired && (
                      <span className={`${styles.statusBadge} ${styles.statusExpired}`}>
                        Expired
                      </span>
                    )}
                  </div>
                </div>
                
                <div className={styles.cardMeta}>
                  <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>Activation:</span>
                    <span className={styles.metaValue}>{formatDate(pricing.activation)}</span>
                  </div>
                  <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>Expiry:</span>
                    <span className={styles.metaValue}>{formatDate(pricing.expiry)}</span>
                  </div>
                  <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>Recurring:</span>
                    <span className={styles.metaValue}>
                      {pricing.recurring_period_count} {pricing.recurring_period.toLowerCase()}(s)
                    </span>
                  </div>
                  <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>Created by:</span>
                    <span className={styles.metaValue}>{pricing.created_by.name}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Create Pricing Modal */}
      <CreatePricingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          // Refresh pricings after successful creation
          fetchBothPricings();
          setToast({ message: 'Pricing created successfully', type: 'success' });
        }}
        accessToken={accessToken}
      />
    </div>
  );
};

AdminPricing.displayName = 'AdminPricing';

