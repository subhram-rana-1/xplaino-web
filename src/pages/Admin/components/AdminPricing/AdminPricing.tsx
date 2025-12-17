import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './AdminPricing.module.css';
import { getAllPricings, getLivePricings } from '@/shared/services/pricing.service';
import type { PricingResponse } from '@/shared/types/pricing.types';
import { Toast } from '@/shared/components/Toast';
import { DropdownIcon } from '@/shared/components/DropdownIcon';
import { CreatePricingModal } from './CreatePricingModal';

type FilterOption = 'all' | 'live';
type StatusTab = 'all' | 'active' | 'inactive';

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
  const [pricings, setPricings] = useState<PricingResponse[]>([]);
  const [filteredPricings, setFilteredPricings] = useState<PricingResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<FilterOption>('all');
  const [statusTab, setStatusTab] = useState<StatusTab>('all');
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type?: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const fetchPricings = async () => {
      if (!accessToken) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        let response;
        
        if (filter === 'live') {
          response = await getLivePricings();
        } else {
          response = await getAllPricings(accessToken);
        }
        
        setPricings(response.pricings);
      } catch (error) {
        console.error('Error fetching pricings:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to load pricing plans';
        setToast({ message: errorMessage, type: 'error' });
      } finally {
        setIsLoading(false);
      }
    };

    fetchPricings();
  }, [filter, accessToken]);

  // Filter pricings based on status tab when filter is 'all'
  useEffect(() => {
    if (filter === 'live') {
      setFilteredPricings(pricings);
      return;
    }

    const currentTime = new Date().getTime();

    let filtered: PricingResponse[] = [];

    switch (statusTab) {
      case 'all':
        filtered = pricings;
        break;
      case 'active':
        filtered = pricings.filter((pricing) => {
          const activation = new Date(pricing.activation).getTime();
          const expiry = new Date(pricing.expiry).getTime();
          return activation < currentTime && currentTime < expiry;
        });
        break;
      case 'inactive':
        filtered = pricings.filter((pricing) => {
          const expiry = new Date(pricing.expiry).getTime();
          return expiry < currentTime;
        });
        break;
    }

    setFilteredPricings(filtered);
  }, [pricings, statusTab, filter]);

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

  const formatPriceDisplay = (pricing: PricingResponse): string => {
    const period = pricing.recurring_period.toLowerCase();
    const count = pricing.recurring_period_count;
    
    if (count === 0) {
      return '$0 per month/user';
    }
    
    if (period === 'year') {
      if (count >= 1000) {
        const thousands = count / 1000;
        return `$${thousands}k per year`;
      }
      return `$${count.toLocaleString()} per year`;
    }
    
    return `$${count} per month/user`;
  };

  const filterOptions: { value: FilterOption; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'live', label: 'Live' },
  ];

  const statusTabs: { value: StatusTab; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
  ];

  const selectedFilterLabel = filterOptions.find(opt => opt.value === filter)?.label || 'All';

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(`.${styles.filterContainer}`)) {
        setIsFilterDropdownOpen(false);
      }
    };

    if (isFilterDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isFilterDropdownOpen]);

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
        <div className={styles.filterContainer}>
          <button
            className={styles.filterButton}
            onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
            aria-haspopup="listbox"
            aria-expanded={isFilterDropdownOpen}
          >
            <span>{selectedFilterLabel}</span>
            <DropdownIcon isOpen={isFilterDropdownOpen} />
          </button>
          {isFilterDropdownOpen && (
            <div className={styles.filterDropdown} role="listbox">
              {filterOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`${styles.filterOption} ${filter === option.value ? styles.filterOptionSelected : ''}`}
                  onClick={() => {
                    setFilter(option.value);
                    setIsFilterDropdownOpen(false);
                    if (option.value === 'live') {
                      setStatusTab('all');
                    }
                  }}
                  role="option"
                  aria-selected={filter === option.value}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          className={styles.addButton}
          onClick={() => setIsModalOpen(true)}
        >
          Add pricing
        </button>
      </div>

      {filter === 'all' && (
        <div className={styles.tabs}>
          {statusTabs.map((tab) => (
            <button
              key={tab.value}
              className={`${styles.tab} ${statusTab === tab.value ? styles.tabActive : ''}`}
              onClick={() => setStatusTab(tab.value)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {filteredPricings.length === 0 ? (
        <div className={styles.emptyState}>
          <h2 className={styles.emptyHeading}>No pricing plans found</h2>
          <p className={styles.emptyMessage}>
            {filter === 'live' 
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
          const fetchPricings = async () => {
            if (!accessToken) return;

            try {
              let response;
              if (filter === 'live') {
                response = await getLivePricings();
              } else {
                response = await getAllPricings(accessToken);
              }
              setPricings(response.pricings);
              setToast({ message: 'Pricing created successfully', type: 'success' });
            } catch (error) {
              console.error('Error refreshing pricings:', error);
            }
          };
          fetchPricings();
        }}
        accessToken={accessToken}
      />
    </div>
  );
};

AdminPricing.displayName = 'AdminPricing';

