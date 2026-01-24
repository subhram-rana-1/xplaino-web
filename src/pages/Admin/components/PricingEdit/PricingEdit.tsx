import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import styles from './PricingEdit.module.css';
import { getFeatures } from '@/shared/services/features.service';
import { updatePricing, getPricingById } from '@/shared/services/pricing.service';
import type { Feature } from '@/shared/types/features.types';
import type { PricingResponse, UpdatePricingRequest, PricingFeature } from '@/shared/types/pricing.types';
import { PricingStatus, Currency, MaxAllowedType } from '@/shared/types/pricing.types';
import { useAuth } from '@/shared/hooks/useAuth';
import { Toast } from '@/shared/components/Toast';
import { DropdownIcon } from '@/shared/components/DropdownIcon';
import { Admin } from '../../Admin';

interface FeatureFormData {
  name: string;
  description: string;
  is_allowed: boolean;
  max_allowed_type: MaxAllowedType | null;
  max_allowed_count: number | null;
}

/**
 * PricingEdit - Edit pricing plan component
 */
export const PricingEdit: React.FC = () => {
  const { pricingId } = useParams<{ pricingId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { accessToken } = useAuth();

  // Get pricing data from navigation state
  const pricingFromState = (location.state as { pricing?: PricingResponse })?.pricing;

  const [pricing, setPricing] = useState<PricingResponse | null>(pricingFromState || null);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [isLoadingPricing, setIsLoadingPricing] = useState(!pricingFromState);
  const [isLoadingFeatures, setIsLoadingFeatures] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type?: 'success' | 'error' } | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    activation: '',
    expiry: '',
    status: PricingStatus.ENABLED,
    currency: Currency.USD,
    description: '',
    is_highlighted: false,
    monthly_price: '',
    monthly_discount_percentage: '',
    monthly_discount_valid_till: '',
    is_yearly_enabled: false,
    yearly_discount_percentage: '',
    yearly_discount_valid_till: '',
  });

  const [selectedFeatures, setSelectedFeatures] = useState<Map<string, FeatureFormData>>(new Map());
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [isCurrencyDropdownOpen, setIsCurrencyDropdownOpen] = useState(false);

  // Fetch pricing if not in state
  useEffect(() => {
    const fetchPricing = async () => {
      if (!accessToken || !pricingId || pricingFromState) return;

      try {
        setIsLoadingPricing(true);
        const fetchedPricing = await getPricingById(accessToken, pricingId);
        setPricing(fetchedPricing);
      } catch (error) {
        console.error('Error fetching pricing:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to load pricing';
        setToast({ message: errorMessage, type: 'error' });
      } finally {
        setIsLoadingPricing(false);
      }
    };

    fetchPricing();
  }, [accessToken, pricingId, pricingFromState]);

  // Fetch features on mount
  useEffect(() => {
    const fetchFeatures = async () => {
      if (!accessToken) return;

      try {
        setIsLoadingFeatures(true);
        const response = await getFeatures(accessToken);
        setFeatures(response.features);
      } catch (error) {
        console.error('Error fetching features:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to load features';
        setToast({ message: errorMessage, type: 'error' });
      } finally {
        setIsLoadingFeatures(false);
      }
    };

    fetchFeatures();
  }, [accessToken]);

  // Initialize form data from pricing
  useEffect(() => {
    if (pricing && features.length > 0) {
      // Convert ISO dates to datetime-local format
      const activationDate = new Date(pricing.activation);
      const expiryDate = new Date(pricing.expiry);
      
      const activationLocal = new Date(activationDate.getTime() - activationDate.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
      const expiryLocal = new Date(expiryDate.getTime() - expiryDate.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);

      const monthlyDiscountValidTillDate = new Date(pricing.pricing_details.monthly_discount.discount_valid_till);
      const monthlyDiscountValidTillLocal = new Date(monthlyDiscountValidTillDate.getTime() - monthlyDiscountValidTillDate.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);

      const yearlyDiscountValidTillLocal = pricing.pricing_details.yearly_discount 
        ? new Date(new Date(pricing.pricing_details.yearly_discount.discount_valid_till).getTime() - new Date(pricing.pricing_details.yearly_discount.discount_valid_till).getTimezoneOffset() * 60000)
            .toISOString()
            .slice(0, 16)
        : '';

      setFormData({
        name: pricing.name,
        activation: activationLocal,
        expiry: expiryLocal,
        status: pricing.status as PricingStatus,
        currency: pricing.currency as Currency,
        description: pricing.description || '',
        is_highlighted: pricing.is_highlighted || false,
        monthly_price: pricing.pricing_details.monthly_price.toString(),
        monthly_discount_percentage: pricing.pricing_details.monthly_discount.discount_percentage.toString(),
        monthly_discount_valid_till: monthlyDiscountValidTillLocal,
        is_yearly_enabled: pricing.pricing_details.is_yearly_enabled,
        yearly_discount_percentage: pricing.pricing_details.yearly_discount?.discount_percentage.toString() || '',
        yearly_discount_valid_till: yearlyDiscountValidTillLocal,
      });

      // Initialize selectedFeatures map
      const featuresMap = new Map<string, FeatureFormData>();
      
      // First, add all available features
      features.forEach(feature => {
        const existingFeature = pricing.features.find(f => f.name === feature.name);
        
        if (existingFeature) {
          featuresMap.set(feature.name, {
            name: feature.name,
            description: feature.description,
            is_allowed: existingFeature.is_allowed,
            max_allowed_type: existingFeature.max_allowed_type,
            max_allowed_count: existingFeature.max_allowed_count,
          });
        } else {
          featuresMap.set(feature.name, {
            name: feature.name,
            description: feature.description,
            is_allowed: false,
            max_allowed_type: null,
            max_allowed_count: null,
          });
        }
      });

      setSelectedFeatures(featuresMap);
    }
  }, [pricing, features]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: checked,
    }));
  };

  const handleFeatureToggle = (featureName: string) => {
    setSelectedFeatures(prev => {
      const newMap = new Map(prev);
      const feature = newMap.get(featureName);
      if (feature) {
        newMap.set(featureName, {
          ...feature,
          is_allowed: !feature.is_allowed,
          // Auto-select Unlimited when checking, reset when unchecking
          max_allowed_type: !feature.is_allowed ? MaxAllowedType.UNLIMITED : null,
          max_allowed_count: null,
        });
      }
      return newMap;
    });
  };

  const handleToggleAllFeatures = () => {
    setSelectedFeatures(prev => {
      const newMap = new Map(prev);
      // Check if all features are currently selected
      const allSelected = Array.from(newMap.values()).every(f => f.is_allowed);
      
      if (allSelected) {
        // Deselect all
        newMap.forEach((feature, name) => {
          newMap.set(name, {
            ...feature,
            is_allowed: false,
            max_allowed_type: null,
            max_allowed_count: null,
          });
        });
      } else {
        // Select all with Unlimited
        newMap.forEach((feature, name) => {
          newMap.set(name, {
            ...feature,
            is_allowed: true,
            max_allowed_type: MaxAllowedType.UNLIMITED,
            max_allowed_count: null,
          });
        });
      }
      return newMap;
    });
  };

  // Check if all features are selected
  const allFeaturesSelected = Array.from(selectedFeatures.values()).every(f => f.is_allowed);

  const handleFeatureTypeChange = (featureName: string, type: MaxAllowedType) => {
    setSelectedFeatures(prev => {
      const newMap = new Map(prev);
      const feature = newMap.get(featureName);
      if (feature) {
        newMap.set(featureName, {
          ...feature,
          max_allowed_type: type,
          max_allowed_count: type === MaxAllowedType.UNLIMITED ? null : (feature.max_allowed_count || 1),
        });
      }
      return newMap;
    });
  };

  const handleFeatureCountChange = (featureName: string, count: string) => {
    const numericCount = parseInt(count, 10);
    setSelectedFeatures(prev => {
      const newMap = new Map(prev);
      const feature = newMap.get(featureName);
      if (feature) {
        newMap.set(featureName, {
          ...feature,
          max_allowed_count: count === '' ? null : (isNaN(numericCount) ? null : numericCount),
        });
      }
      return newMap;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!accessToken || !pricingId) {
      setToast({ message: 'Not authenticated', type: 'error' });
      return;
    }

    // Validation
    if (!formData.name.trim()) {
      setToast({ message: 'Please enter a pricing name', type: 'error' });
      return;
    }

    if (!formData.description.trim()) {
      setToast({ message: 'Please enter a pricing description', type: 'error' });
      return;
    }

    if (formData.description.trim().length > 500) {
      setToast({ message: 'Description must be 500 characters or less', type: 'error' });
      return;
    }

    if (!formData.activation || !formData.expiry) {
      setToast({ message: 'Please select activation and expiry dates', type: 'error' });
      return;
    }

    const activationDate = new Date(formData.activation);
    const expiryDate = new Date(formData.expiry);
    if (activationDate >= expiryDate) {
      setToast({ message: 'Expiry date must be after activation date', type: 'error' });
      return;
    }

    const monthlyPrice = parseFloat(formData.monthly_price);
    if (isNaN(monthlyPrice) || monthlyPrice <= 0) {
      setToast({ message: 'Monthly price must be greater than 0', type: 'error' });
      return;
    }

    const monthlyDiscountPercentage = parseFloat(formData.monthly_discount_percentage);
    if (isNaN(monthlyDiscountPercentage) || monthlyDiscountPercentage < 0 || monthlyDiscountPercentage > 100) {
      setToast({ message: 'Monthly discount percentage must be between 0 and 100', type: 'error' });
      return;
    }

    if (!formData.monthly_discount_valid_till) {
      setToast({ message: 'Please select monthly discount valid till date', type: 'error' });
      return;
    }

    if (formData.is_yearly_enabled) {
      const yearlyDiscountPercentage = parseFloat(formData.yearly_discount_percentage);
      if (isNaN(yearlyDiscountPercentage) || yearlyDiscountPercentage < 0 || yearlyDiscountPercentage > 100) {
        setToast({ message: 'Yearly discount percentage must be between 0 and 100', type: 'error' });
        return;
      }

      if (!formData.yearly_discount_valid_till) {
        setToast({ message: 'Please select yearly discount valid till date', type: 'error' });
        return;
      }
    }

    // Validate at least one feature is selected
    const hasSelectedFeature = Array.from(selectedFeatures.values()).some(f => f.is_allowed);
    if (!hasSelectedFeature) {
      setToast({ message: 'Please select at least one feature', type: 'error' });
      return;
    }

    // Validate feature counts
    for (const feature of selectedFeatures.values()) {
      if (feature.is_allowed && feature.max_allowed_type === MaxAllowedType.FIXED) {
        if (!feature.max_allowed_count || feature.max_allowed_count <= 0) {
          setToast({ message: `Please enter a valid count (> 0) for feature: ${feature.name}`, type: 'error' });
          return;
        }
      }
    }

    try {
      setIsSubmitting(true);

      // Convert local datetime to ISO format
      const activationISO = new Date(formData.activation).toISOString();
      const expiryISO = new Date(formData.expiry).toISOString();
      const monthlyDiscountValidTillISO = new Date(formData.monthly_discount_valid_till).toISOString();

      // Build features array
      const pricingFeatures: PricingFeature[] = Array.from(selectedFeatures.values()).map(f => ({
        name: f.name,
        is_allowed: f.is_allowed,
        max_allowed_type: f.is_allowed ? f.max_allowed_type : null,
        max_allowed_count: f.is_allowed && f.max_allowed_type === MaxAllowedType.FIXED ? f.max_allowed_count : null,
      }));

      const requestBody: UpdatePricingRequest = {
        name: formData.name.trim(),
        activation: activationISO,
        expiry: expiryISO,
        status: formData.status,
        features: pricingFeatures,
        currency: formData.currency,
        description: formData.description.trim(),
        is_highlighted: formData.is_highlighted,
        pricing_details: {
          monthly_price: monthlyPrice,
          monthly_discount: {
            discount_percentage: monthlyDiscountPercentage,
            discount_valid_till: monthlyDiscountValidTillISO,
          },
          is_yearly_enabled: formData.is_yearly_enabled,
          yearly_discount: formData.is_yearly_enabled ? {
            discount_percentage: parseFloat(formData.yearly_discount_percentage),
            discount_valid_till: new Date(formData.yearly_discount_valid_till).toISOString(),
          } : null,
        },
      };

      const updatedPricing = await updatePricing(accessToken, pricingId, requestBody);
      setToast({ message: 'Pricing updated successfully', type: 'success' });
      
      // Navigate back to detail page after a short delay
      setTimeout(() => {
        navigate(`/admin/pricing/${pricingId}`, { state: { pricing: updatedPricing } });
      }, 1000);
    } catch (error) {
      console.error('Error updating pricing:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update pricing';
      setToast({ message: errorMessage, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate(`/admin/pricing/${pricingId}`);
  };

  if (isLoadingPricing || isLoadingFeatures) {
    return (
      <Admin>
        <div className={styles.pricingEdit}>
          <div className={styles.loading}>Loading...</div>
        </div>
      </Admin>
    );
  }

  if (!pricing) {
    return (
      <Admin>
      <div className={styles.pricingEdit}>
        <div className={styles.error}>Pricing not found</div>
          <button className={styles.backButton} onClick={() => navigate('/admin/pricing')}>
            ← Back to Pricing List
        </button>
      </div>
      </Admin>
    );
  }

  return (
    <Admin>
    <div className={styles.pricingEdit}>
      <div className={styles.header}>
          <button onClick={handleCancel} className={styles.backButton}>
          ← Back
        </button>
          <h1 className={styles.title}>Edit Pricing Plan</h1>
      </div>

        <form onSubmit={handleSubmit} className={styles.card}>
          {/* Basic Information */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Basic Information</h2>
            
        <div className={styles.fieldRow}>
          <div className={styles.field}>
                <label className={styles.label}>Name *</label>
              <input
                type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                className={styles.input}
                  placeholder="e.g., Premium Plan"
                maxLength={30}
                  required
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Status *</label>
                <div className={styles.dropdownContainer}>
                  <button
                    type="button"
                    className={`${styles.dropdownButton} ${isStatusDropdownOpen ? styles.dropdownButtonOpen : ''}`}
                    onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                  >
                    {formData.status}
                    <DropdownIcon isOpen={isStatusDropdownOpen} />
                  </button>
                  {isStatusDropdownOpen && (
                    <div className={styles.dropdownList}>
                      <button
                        type="button"
                        className={styles.dropdownItem}
                        onClick={() => {
                          setFormData(prev => ({ ...prev, status: PricingStatus.ENABLED }));
                          setIsStatusDropdownOpen(false);
                        }}
                      >
                        ENABLED
                      </button>
                      <button
                        type="button"
                        className={styles.dropdownItem}
                        onClick={() => {
                          setFormData(prev => ({ ...prev, status: PricingStatus.DISABLED }));
                          setIsStatusDropdownOpen(false);
                        }}
                      >
                        DISABLED
                      </button>
                    </div>
                  )}
                </div>
          </div>
        </div>

        <div className={styles.fieldRow}>
          <div className={styles.field}>
                <label className={styles.label}>Activation Date *</label>
                <input
                  type="datetime-local"
                  name="activation"
                  value={formData.activation}
                  onChange={handleInputChange}
                  className={styles.input}
                  required
                />
          </div>

          <div className={styles.field}>
                <label className={styles.label}>Expiry Date *</label>
                <input
                  type="datetime-local"
                  name="expiry"
                  value={formData.expiry}
                  onChange={handleInputChange}
                  className={styles.input}
                  required
                />
          </div>
        </div>

            <div className={styles.fieldRow}>
              <div className={styles.field}>
                <label className={styles.label}>Currency *</label>
              <div className={styles.dropdownContainer}>
                <button
                  type="button"
                  className={`${styles.dropdownButton} ${isCurrencyDropdownOpen ? styles.dropdownButtonOpen : ''}`}
                  onClick={() => {
                    setIsCurrencyDropdownOpen(!isCurrencyDropdownOpen);
                    setIsStatusDropdownOpen(false);
                  }}
                >
                    {formData.currency}
                  <DropdownIcon isOpen={isCurrencyDropdownOpen} />
                </button>
                {isCurrencyDropdownOpen && (
                    <div className={styles.dropdownList}>
                      <button
                        type="button"
                        className={styles.dropdownItem}
                        onClick={() => {
                          setFormData(prev => ({ ...prev, currency: Currency.USD }));
                          setIsCurrencyDropdownOpen(false);
                        }}
                      >
                        USD
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className={styles.fieldRow}>
              <div className={styles.field}>
                <label className={styles.label}>Description *</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className={styles.textarea}
                  placeholder="Describe this pricing plan..."
                  maxLength={500}
                  rows={3}
                  required
                />
                <span className={styles.charCount}>
                  {formData.description.length}/500 characters
                </span>
              </div>
            </div>

            <div className={styles.fieldRow}>
              <div className={styles.field}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    name="is_highlighted"
                    checked={formData.is_highlighted}
                    onChange={handleCheckboxChange}
                    className={styles.checkbox}
                  />
                  Mark as Highlighted (Featured/Most Popular)
                </label>
              </div>
            </div>
          </div>

          {/* Pricing Details */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Pricing Details</h2>

        <div className={styles.fieldRow}>
          <div className={styles.field}>
                <label className={styles.label}>Monthly Price ($) *</label>
                <input
                  type="number"
                  name="monthly_price"
                  value={formData.monthly_price}
                  onChange={handleInputChange}
                  className={styles.input}
                  placeholder="e.g., 9.99"
                  step="0.01"
                  min="0.01"
                  required
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Monthly Discount (%) *</label>
                <input
                  type="number"
                  name="monthly_discount_percentage"
                  value={formData.monthly_discount_percentage}
                  onChange={handleInputChange}
                  className={styles.input}
                  placeholder="e.g., 10"
                  step="0.01"
                  min="0"
                  max="100"
                  required
                />
              </div>
          </div>

            <div className={styles.fieldRow}>
          <div className={styles.field}>
                <label className={styles.label}>Monthly Discount Valid Till *</label>
                <input
                  type="datetime-local"
                  name="monthly_discount_valid_till"
                  value={formData.monthly_discount_valid_till}
                  onChange={handleInputChange}
                  className={styles.input}
                  required
                />
              </div>
            </div>

            <div className={styles.fieldRow}>
              <div className={styles.field}>
                <label className={styles.checkboxLabel}>
                <input
                    type="checkbox"
                    name="is_yearly_enabled"
                    checked={formData.is_yearly_enabled}
                    onChange={handleCheckboxChange}
                    className={styles.checkbox}
                  />
                  Enable Yearly Pricing
                </label>
              </div>
            </div>

            {formData.is_yearly_enabled && (
              <>
                <div className={styles.fieldRow}>
                  <div className={styles.field}>
                    <label className={styles.label}>Yearly Discount (%) *</label>
                    <input
                      type="number"
                      name="yearly_discount_percentage"
                      value={formData.yearly_discount_percentage}
                      onChange={handleInputChange}
                      className={styles.input}
                      placeholder="e.g., 20"
                      step="0.01"
                      min="0"
                      max="100"
                      required={formData.is_yearly_enabled}
                    />
                  </div>

                  <div className={styles.field}>
                    <label className={styles.label}>Yearly Discount Valid Till *</label>
                    <input
                      type="datetime-local"
                      name="yearly_discount_valid_till"
                      value={formData.yearly_discount_valid_till}
                      onChange={handleInputChange}
                      className={styles.input}
                      required={formData.is_yearly_enabled}
                    />
                  </div>
                </div>
              </>
            )}
        </div>

          {/* Features Selection */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Features</h2>
              {features.length > 0 && (
                <button
                  type="button"
                  className={styles.selectAllButton}
                  onClick={handleToggleAllFeatures}
                >
                  {allFeaturesSelected ? 'Deselect All Features' : 'Select All Features'}
                </button>
              )}
                  </div>
            
            {features.length === 0 ? (
              <div className={styles.emptyFeatures}>
                No features available. Please contact system administrator.
              </div>
            ) : (
              <div className={styles.featuresList}>
                {features.map(feature => {
                  const featureData = selectedFeatures.get(feature.name);
                  if (!featureData) return null;

                  return (
                    <div key={feature.name} className={styles.featureItem}>
                      <div className={styles.featureHeader}>
                        <label className={styles.featureCheckboxLabel}>
                          <input
                            type="checkbox"
                            checked={featureData.is_allowed}
                            onChange={() => handleFeatureToggle(feature.name)}
                            className={styles.checkbox}
                          />
                          <div className={styles.featureInfo}>
                            <span className={styles.featureName}>{feature.name}</span>
                            <span className={styles.featureDescription}>{feature.description}</span>
          </div>
                        </label>
          </div>

                      {featureData.is_allowed && (
                        <div className={styles.featureOptions}>
                          <div className={styles.featureOptionRow}>
                            <label className={styles.radioLabel}>
                              <input
                                type="radio"
                                name={`${feature.name}-type`}
                                checked={featureData.max_allowed_type === MaxAllowedType.FIXED}
                                onChange={() => handleFeatureTypeChange(feature.name, MaxAllowedType.FIXED)}
                                className={styles.radio}
                              />
                              Fixed Count
                            </label>
                            <label className={styles.radioLabel}>
                              <input
                                type="radio"
                                name={`${feature.name}-type`}
                                checked={featureData.max_allowed_type === MaxAllowedType.UNLIMITED}
                                onChange={() => handleFeatureTypeChange(feature.name, MaxAllowedType.UNLIMITED)}
                                className={styles.radio}
                              />
                              Unlimited
                            </label>
        </div>

                          {featureData.max_allowed_type === MaxAllowedType.FIXED && (
                            <div className={styles.featureCountField}>
                              <label className={styles.label}>Count *</label>
                              <input
                                type="number"
                                value={featureData.max_allowed_count || ''}
                                onChange={(e) => handleFeatureCountChange(feature.name, e.target.value)}
                                className={styles.input}
                                placeholder="e.g., 100"
                                min="1"
                                required
                              />
                            </div>
                          )}
                        </div>
                      )}
          </div>
                  );
                })}
          </div>
            )}
        </div>

          {/* Action Buttons */}
        <div className={styles.actions}>
          <button
              type="button"
              onClick={handleCancel}
                  className={styles.cancelButton}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
              type="submit"
              className={styles.submitButton}
                  disabled={isSubmitting}
                >
              {isSubmitting ? 'Updating...' : 'Update Pricing'}
              </button>
          </div>
        </form>

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

PricingEdit.displayName = 'PricingEdit';
