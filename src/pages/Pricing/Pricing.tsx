import React, { useEffect, useState } from 'react';
import styles from './Pricing.module.css';
import { getLivePricings } from '@/shared/services/pricing.service';
import type { PricingResponse } from '@/shared/types/pricing.types';
import { Toast } from '@/shared/components/Toast';
import { ChromeButton } from '@/shared/components/ChromeButton';

/**
 * Pricing - Pricing page component displaying pricing plans
 * 
 * @returns JSX element
 */
export const Pricing: React.FC = () => {
  const [pricings, setPricings] = useState<PricingResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type?: 'success' | 'error' } | null>(null);
  const [billingCycles, setBillingCycles] = useState<Record<string, 'monthly' | 'yearly'>>({});

  useEffect(() => {
    const fetchPricings = async () => {
      try {
        setIsLoading(true);
        const response = await getLivePricings();
        setPricings(response.pricings);
        
        // Initialize billing cycles for each pricing (default to yearly)
        const initialCycles: Record<string, 'monthly' | 'yearly'> = {};
        response.pricings.forEach(pricing => {
          initialCycles[pricing.id] = 'yearly';
        });
        setBillingCycles(initialCycles);
      } catch (error) {
        console.error('Error fetching pricings:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to load pricing plans';
        setToast({ message: errorMessage, type: 'error' });
      } finally {
        setIsLoading(false);
      }
    };

    fetchPricings();
  }, []);

  const toggleBillingCycle = (pricingId: string) => {
    setBillingCycles(prev => ({
      ...prev,
      [pricingId]: prev[pricingId] === 'monthly' ? 'yearly' : 'monthly'
    }));
  };

  const calculatePrice = (pricing: PricingResponse, billingCycle: 'monthly' | 'yearly'): { price: number; originalPrice: number; discount: number } => {
    const monthlyPrice = pricing.pricing_details.monthly_price;
    const monthlyDiscount = pricing.pricing_details.monthly_discount.discount_percentage;
    
    if (billingCycle === 'monthly') {
      const discountedPrice = monthlyPrice * (1 - monthlyDiscount / 100);
      return {
        price: discountedPrice,
        originalPrice: monthlyPrice,
        discount: monthlyDiscount
      };
    } else {
      // Yearly billing
      if (pricing.pricing_details.is_yearly_enabled && pricing.pricing_details.yearly_discount) {
        const yearlyPrice = monthlyPrice * 12;
        const yearlyDiscount = pricing.pricing_details.yearly_discount.discount_percentage;
        const discountedYearlyPrice = yearlyPrice * (1 - yearlyDiscount / 100);
        return {
          price: discountedYearlyPrice / 12, // Show monthly equivalent
          originalPrice: monthlyPrice,
          discount: yearlyDiscount
        };
      } else {
        // No yearly pricing, fallback to monthly
        const discountedPrice = monthlyPrice * (1 - monthlyDiscount / 100);
        return {
          price: discountedPrice,
          originalPrice: monthlyPrice,
          discount: monthlyDiscount
        };
      }
    }
  };

  const formatPriceDisplay = (pricing: PricingResponse, billingCycle: 'monthly' | 'yearly'): React.ReactNode => {
    const { price, originalPrice, discount } = calculatePrice(pricing, billingCycle);
    const currency = pricing.currency;
    const currencySymbol = currency === 'USD' ? '$' : currency;
    
    if (price === 0) {
      return (
        <div className={styles.priceContainer}>
          <div className={styles.priceAmount}>{currencySymbol}0</div>
          <div className={styles.pricePeriod}>per month</div>
        </div>
      );
    }

    return (
      <div className={styles.priceContainer}>
        <div className={styles.priceAmount}>
          {discount > 0 && (
            <span className={styles.originalPrice}>{currencySymbol}{originalPrice.toFixed(2)} </span>
          )}
          {currencySymbol}{price.toFixed(2)}
        </div>
        <div className={styles.pricePeriod}>
          per month {billingCycle === 'yearly' && '(billed annually)'}
        </div>
      </div>
    );
  };

  const formatFeatureLimit = (feature: any): string => {
    if (!feature.is_allowed) return '';
    if (feature.max_allowed_type === 'UNLIMITED') return 'Unlimited';
    if (feature.max_allowed_type === 'FIXED' && feature.max_allowed_count) {
      return `${feature.max_allowed_count.toLocaleString()}`;
    }
    return '';
  };

  const getButtonText = (pricing: PricingResponse, billingCycle: 'monthly' | 'yearly'): string => {
    const name = pricing.name.toLowerCase();
    if (name.includes('enterprise')) {
      return 'Contact us';
    }
    if (calculatePrice(pricing, billingCycle).price === 0) {
      return 'Get started for free';
    }
    return 'Get started';
  };

  const getButtonClass = (pricing: PricingResponse, index: number): string => {
    // Highlighted plan gets primary button
    if (pricing.is_highlighted) {
      return styles.buttonPrimary;
    }
    const name = pricing.name.toLowerCase();
    // Middle card (index 1) or Team/Pro plans get blue button
    if (index === 1 || name.includes('team') || name.includes('pro')) {
      return styles.buttonPrimary;
    }
    return styles.buttonSecondary;
  };

  if (isLoading) {
    return (
      <div className={styles.pricing}>
        <div className={styles.container}>
          <div className={styles.loading}>Loading pricing plans...</div>
        </div>
      </div>
    );
  }

  if (pricings.length === 0) {
    return (
      <div className={styles.pricingEmpty}>
        <div className={styles.emptyState}>
          <p className={styles.emptyMessage}>
            <strong style={{ fontWeight: 800 }}>Free while in beta</strong>
            <br />
            <span style={{ fontSize: '0.85em', fontStyle: 'italic' }}>Join thousands of early adopters before pricing kicks in!</span>
          </p>
          <div className={styles.chromeButtonContainer}>
            <ChromeButton />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pricing}>
      <div className={styles.container}>
        <h1 className={styles.heading}>Pricing</h1>

        <div className={styles.cards}>
          {pricings.map((pricing, index) => {
            const isMiddleCard = index === 1;
            const allowedFeatures = pricing.features.filter(f => f.is_allowed);
            const billingCycle = billingCycles[pricing.id] || 'monthly';
            const hasYearlyOption = pricing.pricing_details.is_yearly_enabled;
            const { discount } = calculatePrice(pricing, billingCycle);
            
            return (
              <div 
                key={pricing.id} 
                className={`${styles.card} ${isMiddleCard ? styles.cardMiddle : ''}`}
              >
                {pricing.is_highlighted && (
                  <div className={styles.banner}>Most Popular</div>
                )}
                <div className={`${styles.cardTitleContainer} ${pricing.is_highlighted ? styles.cardTitleWithBanner : ''}`}>
                  <h2 className={styles.cardTitle}>{pricing.name}</h2>
                  {discount > 0 && (
                    <span className={styles.titleDiscountBadge}>{discount}% OFF</span>
                  )}
                </div>
                
                {/* Billing Cycle Toggle inside card */}
                {hasYearlyOption && (
                  <div className={styles.cardBillingToggle}>
                    <span className={`${styles.toggleLabel} ${billingCycle === 'monthly' ? styles.toggleLabelActive : ''}`}>
                      Monthly
                    </span>
                    <button
                      className={styles.toggleSwitch}
                      onClick={() => toggleBillingCycle(pricing.id)}
                      role="switch"
                      aria-checked={billingCycle === 'yearly'}
                    >
                      <span className={`${styles.toggleSlider} ${billingCycle === 'yearly' ? styles.toggleSliderActive : ''}`} />
                    </button>
                    <span className={`${styles.toggleLabel} ${billingCycle === 'yearly' ? styles.toggleLabelActive : ''}`}>
                      Yearly
                      {pricing.pricing_details.yearly_discount && (
                        <span className={styles.cardSaveBadge}>
                          Save {pricing.pricing_details.yearly_discount.discount_percentage}%
                        </span>
                      )}
                    </span>
                  </div>
                )}
                
                <div className={styles.price}>{formatPriceDisplay(pricing, billingCycle)}</div>
                <p className={styles.description}>{pricing.description}</p>
                <button className={getButtonClass(pricing, index)}>
                  {getButtonText(pricing, billingCycle)}
                </button>
                <div className={styles.features}>
                  {index === 1 && allowedFeatures.length > 0 && (
                    <p className={styles.featuresPrefix}>Free plan features, plus:</p>
                  )}
                  {index === 2 && allowedFeatures.length > 0 && (
                    <p className={styles.featuresPrefix}>Standard plan features, plus:</p>
                  )}
                  <ul className={styles.featuresList}>
                    {allowedFeatures.map((feature, idx) => {
                      const limit = formatFeatureLimit(feature);
                      return (
                      <li key={idx} className={styles.featureItem}>
                        <span className={styles.checkmark}>✓</span>
                          <span className={styles.featureText}>
                            {limit && <span className={styles.featureLimit}>{limit} </span>}
                            {feature.description || feature.name}
                          </span>
                      </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>

        {/* Toast Notification */}
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </div>
    </div>
  );
};

Pricing.displayName = 'Pricing';
