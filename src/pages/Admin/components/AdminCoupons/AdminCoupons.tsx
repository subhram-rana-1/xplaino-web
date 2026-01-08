import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiRefreshCw, FiTrash2, FiEdit } from 'react-icons/fi';
import styles from './AdminCoupons.module.css';
import { getAllCoupons, deleteCoupon, type GetAllCouponsFilters } from '@/shared/services/coupon.service';
import type { CouponResponse } from '@/shared/types/coupon.types';
import { Toast } from '@/shared/components/Toast';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { CreateCouponModal } from './CreateCouponModal';
import { DropdownIcon } from '@/shared/components/DropdownIcon';

const PAGE_SIZE = 20;

interface AdminCouponsProps {
  accessToken: string | null;
}

/**
 * AdminCoupons - Admin coupon management component
 * 
 * @returns JSX element
 */
export const AdminCoupons: React.FC<AdminCouponsProps> = ({ accessToken }) => {
  const navigate = useNavigate();
  const [coupons, setCoupons] = useState<CouponResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type?: 'success' | 'error' } | null>(null);
  
  // Pagination states
  const [currentOffset, setCurrentOffset] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  
  // Tab state
  const [activeTab, setActiveTab] = useState<'all' | 'active'>('all');
  
  // Filter states
  const [filters, setFilters] = useState<GetAllCouponsFilters>({});
  const [codeFilter, setCodeFilter] = useState('');
  const [nameFilter, setNameFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  
  // Delete confirmation state
  const [couponToDelete, setCouponToDelete] = useState<CouponResponse | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isStatusDropdownOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(`.${styles.filterContainer}`)) {
        setIsStatusDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isStatusDropdownOpen]);

  const fetchCoupons = async (offset: number = 0) => {
    if (!accessToken) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      
      // Build API filters with is_active based on active tab
      const apiFilters: GetAllCouponsFilters = {
        ...filters,
        is_active: activeTab === 'active' ? true : undefined,
      };
      
      // If filtering by HIGHLIGHTED, fetch all coupons without status filter for client-side filtering
      if (statusFilter === 'HIGHLIGHTED') {
        apiFilters.status = undefined;
      }
      
      const response = await getAllCoupons(accessToken, apiFilters, offset, PAGE_SIZE);
      
      // If filtering by HIGHLIGHTED, filter client-side
      if (statusFilter === 'HIGHLIGHTED') {
        const highlightedCoupons = response.coupons.filter(coupon => coupon.is_highlighted);
        setCoupons(highlightedCoupons);
        // For highlighted filter, we need to get total count of all highlighted coupons
        // Since we're doing client-side filtering, we'll use the filtered count
        setTotalCount(highlightedCoupons.length);
        setHasNext(false); // Disable pagination for client-side filtered results
      } else {
        setCoupons(response.coupons);
        setTotalCount(response.total);
        setHasNext(response.has_next);
      }
      
      setCurrentOffset(offset);
    } catch (error) {
      console.error('Error fetching coupons:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load coupons';
      setToast({ message: errorMessage, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (accessToken) {
      fetchCoupons(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, filters, activeTab]);

  // Apply filters with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      const newFilters: GetAllCouponsFilters = {};
      if (codeFilter.trim()) {
        newFilters.code = codeFilter.trim();
      }
      if (nameFilter.trim()) {
        newFilters.name = nameFilter.trim();
      }
      // Only add status to API filters if it's not HIGHLIGHTED (handled client-side)
      if (statusFilter && statusFilter !== 'HIGHLIGHTED') {
        newFilters.status = statusFilter;
      }
      setFilters(newFilters);
      setCurrentOffset(0);
    }, 300);

    return () => clearTimeout(timer);
  }, [codeFilter, nameFilter, statusFilter]);

  const handlePrevious = () => {
    const newOffset = Math.max(0, currentOffset - PAGE_SIZE);
    fetchCoupons(newOffset);
  };

  const handleNext = () => {
    if (hasNext) {
      fetchCoupons(currentOffset + PAGE_SIZE);
    }
  };

  const handleDeleteClick = (coupon: CouponResponse, e: React.MouseEvent) => {
    e.stopPropagation();
    setCouponToDelete(coupon);
  };

  const handleDeleteConfirm = async () => {
    if (!accessToken || !couponToDelete) return;

    setIsDeleting(true);

    try {
      await deleteCoupon(accessToken, couponToDelete.id);
      setToast({ message: `Coupon "${couponToDelete.code}" deleted successfully`, type: 'success' });
      setCouponToDelete(null);
      fetchCoupons(currentOffset);
    } catch (error) {
      console.error('Error deleting coupon:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete coupon';
      setToast({ message: errorMessage, type: 'error' });
      setCouponToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditClick = (coupon: CouponResponse, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/admin/coupon/${coupon.id}`, { state: { coupon } });
  };

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

  const statusOptions: { value: string; label: string }[] = [
    { value: '', label: 'All' },
    { value: 'ENABLED', label: 'Enabled' },
    { value: 'DISABLED', label: 'Disabled' },
    { value: 'HIGHLIGHTED', label: 'Highlighted' },
  ];

  const selectedStatusLabel = statusOptions.find(
    (opt) => opt.value === statusFilter
  )?.label || 'All';

  if (isLoading && coupons.length === 0) {
    return (
      <div className={styles.adminCoupons}>
        <div className={styles.loading}>Loading coupons...</div>
      </div>
    );
  }

  return (
    <div className={styles.adminCoupons}>
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'all' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('all')}
        >
          All
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'active' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('active')}
        >
          Active
        </button>
      </div>
      
      <div className={styles.header}>
        <div className={styles.filters}>
          <input
            type="text"
            className={styles.filterInput}
            placeholder="Filter by code..."
            value={codeFilter}
            onChange={(e) => setCodeFilter(e.target.value)}
          />
          <input
            type="text"
            className={styles.filterInput}
            placeholder="Filter by name..."
            value={nameFilter}
            onChange={(e) => setNameFilter(e.target.value)}
          />
          <div className={styles.filterContainer}>
            <button
              className={styles.filterButton}
              onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
              aria-haspopup="listbox"
              aria-expanded={isStatusDropdownOpen}
            >
              <span>{selectedStatusLabel}</span>
              <DropdownIcon isOpen={isStatusDropdownOpen} />
            </button>
            {isStatusDropdownOpen && (
              <div className={styles.filterDropdown} role="listbox">
                {statusOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={`${styles.filterOption} ${statusFilter === option.value ? styles.filterOptionSelected : ''}`}
                    onClick={() => {
                      setStatusFilter(option.value);
                      setIsStatusDropdownOpen(false);
                    }}
                    role="option"
                    aria-selected={statusFilter === option.value}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className={styles.headerActions}>
          <button
            className={styles.refreshButton}
            onClick={() => fetchCoupons(currentOffset)}
            disabled={isLoading}
            title="Refresh coupons"
          >
            <FiRefreshCw className={isLoading ? styles.spin : ''} />
          </button>
          <button
            className={styles.addButton}
            onClick={() => setIsModalOpen(true)}
          >
            + Add Coupon
          </button>
        </div>
      </div>

      {coupons.length === 0 ? (
        <div className={styles.emptyState}>
          <h2 className={styles.emptyHeading}>No coupons found</h2>
          <p className={styles.emptyMessage}>
            {Object.keys(filters).length > 0
              ? 'No coupons match your filters.'
              : 'No coupons have been created yet.'}
          </p>
        </div>
      ) : (
        <>
          <div className={styles.couponGrid}>
            {coupons.map((coupon) => {
              const isHighlighted = coupon.is_highlighted;

              let cardClass = styles.couponCard;
              if (isHighlighted) {
                cardClass = `${styles.couponCard} ${styles.cardHighlighted}`;
              }

              return (
                <div
                  key={coupon.id}
                  className={cardClass}
                  onClick={() => navigate(`/admin/coupon/${coupon.id}`, { state: { coupon } })}
                >
                  <div className={styles.cardHeader}>
                    <div className={styles.cardTitleSection}>
                      <h2 className={styles.cardTitle}>{coupon.name}</h2>
                      <div className={styles.cardCode}>{coupon.code}</div>
                      <div className={styles.discount}>{coupon.discount}% OFF</div>
                    </div>
                    <div className={styles.cardActions}>
                      <button
                        className={styles.editButton}
                        onClick={(e) => handleEditClick(coupon, e)}
                        title="Edit coupon"
                        aria-label={`Edit ${coupon.code}`}
                      >
                        <FiEdit />
                      </button>
                      <button
                        className={styles.deleteButton}
                        onClick={(e) => handleDeleteClick(coupon, e)}
                        title="Delete coupon"
                        aria-label={`Delete ${coupon.code}`}
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </div>
                  
                  <div className={styles.cardMeta}>
                    <div className={styles.metaItem}>
                      <span className={styles.metaLabel}>Status:</span>
                      <span className={`${styles.statusBadge} ${styles[`status${coupon.status}`]}`}>
                        {coupon.status}
                      </span>
                      {coupon.is_highlighted && (
                        <span className={`${styles.statusBadge} ${styles.statusHighlighted}`}>
                          Highlighted
                        </span>
                      )}
                    </div>
                    <div className={styles.metaItem}>
                      <span className={styles.metaLabel}>Activation:</span>
                      <span className={styles.metaValue}>{formatDate(coupon.activation)}</span>
                    </div>
                    <div className={styles.metaItem}>
                      <span className={styles.metaLabel}>Expiry:</span>
                      <span className={styles.metaValue}>{formatDate(coupon.expiry)}</span>
                    </div>
                    <div className={styles.metaItem}>
                      <span className={styles.metaLabel}>Created by:</span>
                      <span className={styles.metaValue}>{coupon.created_by.name}</span>
                    </div>
                  </div>
                  
                  {coupon.description && (
                    <div className={styles.description}>
                      <p>{coupon.description}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {totalCount > 0 && (
            <div className={styles.pagination}>
              <div className={styles.paginationInfo}>
                Showing {currentOffset + 1}-{Math.min(currentOffset + PAGE_SIZE, totalCount)} of {totalCount} coupons
              </div>
              <div className={styles.paginationControls}>
                <button
                  className={styles.paginationButton}
                  onClick={handlePrevious}
                  disabled={currentOffset === 0 || isLoading}
                >
                  Previous
                </button>
                <button
                  className={styles.paginationButton}
                  onClick={handleNext}
                  disabled={!hasNext || isLoading}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Create Coupon Modal */}
      <CreateCouponModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          fetchCoupons(0);
          setToast({ message: 'Coupon created successfully', type: 'success' });
        }}
        accessToken={accessToken}
      />

      {/* Delete Confirmation Dialog */}
      {couponToDelete && (
        <ConfirmDialog
          isOpen={!!couponToDelete}
          title="Delete Coupon"
          message={
            <>
              Are you sure you want to delete <strong>"{couponToDelete.code}"</strong>? This action cannot be undone.
            </>
          }
          confirmText={isDeleting ? 'Deleting...' : 'Delete'}
          cancelText="Cancel"
          onConfirm={handleDeleteConfirm}
          onCancel={() => setCouponToDelete(null)}
        />
      )}
    </div>
  );
};

AdminCoupons.displayName = 'AdminCoupons';

