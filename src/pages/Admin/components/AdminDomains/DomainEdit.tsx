import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { FiRefreshCw } from 'react-icons/fi';
import styles from './DomainEdit.module.css';
import { updateDomain, getDomainById } from '@/shared/services/domain.service';
import type { DomainResponse, UpdateDomainRequest, DomainStatus } from '@/shared/types/domain.types';
import { useAuth } from '@/shared/hooks/useAuth';
import { Toast } from '@/shared/components/Toast';
import { DropdownIcon } from '@/shared/components/DropdownIcon';

/**
 * DomainEdit - Edit domain page component
 * Shows domain details in view mode, allows editing when fields are changed
 */
export const DomainEdit: React.FC = () => {
  const { domainId } = useParams<{ domainId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { accessToken } = useAuth();

  // Get domain data from navigation state
  const domainFromState = (location.state as { domain?: DomainResponse })?.domain;

  const [domain, setDomain] = useState<DomainResponse | null>(domainFromState || null);
  const [isLoading, setIsLoading] = useState(!domainFromState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type?: 'success' | 'error' } | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    url: '',
    status: 'ALLOWED' as DomainStatus,
  });
  // Store original form values to compare for changes
  const [originalFormData, setOriginalFormData] = useState({
    url: '',
    status: 'ALLOWED' as DomainStatus,
  });
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);

  // Fetch domain if not in state
  useEffect(() => {
    const fetchDomain = async () => {
      if (!accessToken || !domainId || domainFromState) return;

      try {
        setIsLoading(true);
        const fetchedDomain = await getDomainById(accessToken, domainId);
        setDomain(fetchedDomain);
      } catch (error) {
        console.error('Error fetching domain:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to load domain';
        setToast({ message: errorMessage, type: 'error' });
      } finally {
        setIsLoading(false);
      }
    };

    fetchDomain();
  }, [accessToken, domainId, domainFromState]);

  // Initialize form data from domain
  useEffect(() => {
    if (domain) {
      const initialFormData = {
        url: domain.url,
        status: domain.status as DomainStatus,
      };

      setFormData(initialFormData);
      setOriginalFormData(initialFormData);
    }
  }, [domain]);

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

  /**
   * Validate domain URL format
   * Accepts: example.com, sub.example.com, example.co.uk, my-domain.com
   * Rejects: http://, https://, www., paths
   */
  const validateDomainUrl = (url: string): boolean => {
    // Check for http/https
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return false;
    }

    // Check for www prefix
    if (url.startsWith('www.')) {
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

  const handleUrlChange = (value: string) => {
    setFormData({ ...formData, url: value });
  };

  const handleStatusChange = (value: DomainStatus) => {
    setFormData({ ...formData, status: value });
    setIsStatusDropdownOpen(false);
  };

  // Check if form has changes
  const hasChanges = formData.url !== originalFormData.url || formData.status !== originalFormData.status;

  const handleUpdate = async () => {
    if (!accessToken || !domainId || !domain) return;

    // Validate URL if changed
    if (formData.url !== originalFormData.url && !validateDomainUrl(formData.url.trim())) {
      setToast({ message: 'Invalid domain format. Domain must not include www, http/https, or paths.', type: 'error' });
      return;
    }

    setIsSubmitting(true);

    try {
      const updateData: UpdateDomainRequest = {};

      // Only include fields that have changed
      if (formData.url !== originalFormData.url) {
        updateData.url = formData.url.trim();
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

      const updatedDomain = await updateDomain(accessToken, domainId, updateData);
      setDomain(updatedDomain);
      setOriginalFormData({
        url: updatedDomain.url,
        status: updatedDomain.status as DomainStatus,
      });
      setFormData({
        url: updatedDomain.url,
        status: updatedDomain.status as DomainStatus,
      });
      setToast({ message: 'Domain updated successfully', type: 'success' });
    } catch (error) {
      console.error('Error updating domain:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update domain';
      setToast({ message: errorMessage, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusOptions: { value: DomainStatus; label: string }[] = [
    { value: 'ALLOWED', label: 'Allowed' },
    { value: 'BANNED', label: 'Banned' },
  ];

  if (isLoading) {
    return (
      <div className={styles.domainEdit}>
        <div className={styles.loading}>Loading domain...</div>
      </div>
    );
  }

  if (!domain) {
    return (
      <div className={styles.domainEdit}>
        <div className={styles.error}>Domain not found</div>
        <button className={styles.backButton} onClick={() => navigate('/admin/domain')}>
          Back to Domain
        </button>
      </div>
    );
  }

  return (
    <div className={styles.domainEdit}>
      <div className={styles.header}>
        <button 
          className={styles.backButton} 
          onClick={() => navigate('/admin/domain')}
        >
          ← Back to Domain
        </button>
        <h1 className={styles.title}>Domain Details</h1>
        <button
          className={styles.refreshButton}
          onClick={async () => {
            if (!accessToken || !domainId) return;
            try {
              setIsLoading(true);
              const fetchedDomain = await getDomainById(accessToken, domainId);
              setDomain(fetchedDomain);
              setToast({ message: 'Domain refreshed successfully', type: 'success' });
            } catch (error) {
              console.error('Error refreshing domain:', error);
              const errorMessage = error instanceof Error ? error.message : 'Failed to refresh domain';
              setToast({ message: errorMessage, type: 'error' });
            } finally {
              setIsLoading(false);
            }
          }}
          disabled={isLoading || isSubmitting}
          title="Refresh domain details"
        >
          <FiRefreshCw className={isLoading ? styles.spin : ''} />
        </button>
      </div>

      <div className={styles.card}>
        <div className={styles.fieldRow}>
          <div className={styles.field}>
            <span className={styles.label}>URL</span>
            <input
              type="text"
              className={styles.input}
              value={formData.url}
              onChange={(e) => handleUrlChange(e.target.value)}
              maxLength={100}
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
                <span>{formData.status === 'ALLOWED' ? 'Allowed' : 'Banned'}</span>
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
            <span className={styles.label}>Created At</span>
            <span className={styles.value}>{formatDate(domain.created_at)}</span>
          </div>
          <div className={styles.field}>
            <span className={styles.label}>Updated At</span>
            <span className={styles.value}>{formatDate(domain.updated_at)}</span>
          </div>
        </div>

        <div className={styles.fieldRow}>
          <div className={styles.field}>
            <span className={styles.label}>Created By</span>
            <span className={styles.value}>{domain.created_by.name}</span>
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

DomainEdit.displayName = 'DomainEdit';

