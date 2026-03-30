import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X as XIcon, Check as CheckIcon } from 'lucide-react';
import styles from './Pricing.module.css';
import { usePaddle } from '@/shared/hooks/usePaddle';
import { useAuth } from '@/shared/hooks/useAuth';
import type { FormattedPaddlePrice } from '@/shared/types/paddle.types';
import { paddleConfig } from '@/shared/config/paddle.config';
import { Toast } from '@/shared/components/Toast';
import { LoginModal } from '@/shared/components/LoginModal';

type BillingPeriod = 'monthly' | 'yearly';

// Features for free trial
const freeTrialFeatures = [
  '10 page summaries',
  '50 text explanations',
  '10 image explanations and 20 chats with image',
  'Results in your 60+ languages',
  '5 Page translations',
  '50 Contextual word meanings & vocabulary',
  'Revisit your reading history',
  'Bookmark anything with source links - Page, summary, text, image, word',
  'Create notes from saved content & chat with them',
  'Priority support via tickets'
];

// Features for Ultra plan
const ultraFeatures = [
  'Unlimited Chat with webpages in your language',
  'Unlimited Highlight anything and add notes in webpages',
  'Unlimited Chat with images',
  'Unlimited Chat with words, vocabulary, terminologies',
  'Unlimited Translate in more than 50+ languages',
  'Unlimited bookmark, text, words, images, webpage with source reference',
  'Unlimited PDF features - Chat with PDF, highlight text, add notes',
  'Unlimited Collaborate with colleagues',
  'Priority customer support via tickets at anytime',
];

// Features for Plus plan
const plusFeatures = [
  'Unlimited Chat with webpages in your language',
  'Unlimited Highlight anything and add notes in webpages',
  'Unlimited Chat with images',
  'Unlimited Chat with words, vocabulary, terminologies',
  'Unlimited Translate in more than 50+ languages',
  'Bookmark, text, words, images, webpage with source reference',
  'PDF features - Chat with PDF, highlight text, add notes',
  'Collaboration while learning',
];

// Helper to extract base plan name (remove Monthly/Yearly suffix)
const getBasePlanName = (name: string): string => {
  return name.replace(/\s*(Monthly|Yearly)\s*/gi, '').trim();
};

/**
 * Pricing - Pricing page component displaying Paddle pricing plans
 * with monthly/yearly toggle and Free Trial card
 * 
 * @returns JSX element
 */
export const Pricing: React.FC = () => {
  const { monthlyPrices, yearlyPrices, isLoading, error, openCheckout } = usePaddle();
  const { isLoggedIn, user } = useAuth();
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('yearly');
  const [toast, setToast] = useState<{ message: string; type?: 'success' | 'error' } | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isModalClosing, setIsModalClosing] = useState(false);
  
  // Store the pending price to checkout after login
  const pendingCheckoutRef = useRef<FormattedPaddlePrice | null>(null);
  // Track if Free Trial card triggered the login modal
  const freeTrialLoginRef = useRef<boolean>(false);

  // Get the current prices based on billing period
  const currentPrices = billingPeriod === 'monthly' ? monthlyPrices : yearlyPrices;

  // Group and sort plans dynamically by price (highest first = featured)
  const sortedPlans = useMemo(() => {
    // Sort prices by amount (highest first)
    const sorted = [...currentPrices].sort((a, b) => b.amount - a.amount);
    return sorted;
  }, [currentPrices]);

  // Get discount ID for a price based on its price ID
  const getDiscountIdForPrice = (price: FormattedPaddlePrice): string | undefined => {
    const { discountIds, priceIds } = paddleConfig;
    
    if (billingPeriod === 'monthly') {
      if (price.id === priceIds.monthly.pro) return discountIds.monthly.pro || undefined;
      if (price.id === priceIds.monthly.ultra) return discountIds.monthly.ultra || undefined;
    } else {
      if (price.id === priceIds.yearly.pro) return discountIds.yearly.pro || undefined;
      if (price.id === priceIds.yearly.ultra) return discountIds.yearly.ultra || undefined;
    }
    return undefined;
  };

  // Close modal and proceed to checkout after successful login
  useEffect(() => {
    if (isLoggedIn && showLoginModal) {
      setIsModalClosing(true);
      setTimeout(() => {
        setShowLoginModal(false);
        setIsModalClosing(false);
        
        // If there's a pending checkout (not from Free Trial), proceed with it
        if (pendingCheckoutRef.current && !freeTrialLoginRef.current) {
          const price = pendingCheckoutRef.current;
          pendingCheckoutRef.current = null;
          handleCheckout(price);
        }
        freeTrialLoginRef.current = false;
      }, 300);
    }
  }, [isLoggedIn, showLoginModal]);

  const handleCheckout = async (price: FormattedPaddlePrice) => {
    try {
      setCheckoutLoading(price.id);
      const discountId = getDiscountIdForPrice(price);
      await openCheckout(
        price.id,
        discountId,
        { allowLogout: false },
        { email: user!.email },
        { userId: user!.id }
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to open checkout';
      setToast({ message: errorMessage, type: 'error' });
    } finally {
      setCheckoutLoading(null);
    }
  };

  const handleGetStarted = async (price: FormattedPaddlePrice) => {
    // Check if user is logged in
    if (!isLoggedIn) {
      pendingCheckoutRef.current = price;
      freeTrialLoginRef.current = false;
      setIsModalClosing(false);
      setShowLoginModal(true);
      return;
    }

    await handleCheckout(price);
  };

  const handleFreeTrialClick = () => {
    // For non-logged-in users, show login modal
    if (!isLoggedIn) {
      freeTrialLoginRef.current = true;
      pendingCheckoutRef.current = null;
      setIsModalClosing(false);
      setShowLoginModal(true);
    }
    // For logged-in users, button is disabled
  };

  const handleCloseModal = () => {
    setIsModalClosing(true);
    setTimeout(() => {
      setShowLoginModal(false);
      setIsModalClosing(false);
      pendingCheckoutRef.current = null;
      freeTrialLoginRef.current = false;
    }, 300);
  };

  const getButtonText = (price: FormattedPaddlePrice): string => {
    if (checkoutLoading === price.id) {
      return 'Loading...';
    }
    return 'Get started';
  };

  if (isLoading) {
    return (
      <div className={styles.pricing}>
        <div className={styles.container}>
          <div className={styles.loadingContainer}>
            <div className={styles.loadingHeader}>
              <div className={styles.loadingTitle}></div>
              <div className={styles.loadingSubtitle}></div>
            </div>
            <div className={styles.loadingToggle}></div>
            <div className={styles.loadingCards}>
              {[1, 2, 3].map((i) => (
                <div key={i} className={styles.loadingCard}>
                  <div className={styles.loadingCardTitle}></div>
                  <div className={styles.loadingCardPrice}></div>
                  <div className={styles.loadingCardButton}></div>
                  <div className={styles.loadingCardFeatures}>
                    {[1, 2, 3, 4, 5].map((j) => (
                      <div key={j} className={styles.loadingCardFeature}></div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.pricing}>
        <div className={styles.container}>
          <div className={styles.loading}>{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pricing}>
      <div className={styles.container}>
        <h1 className={styles.heading}>Learn faster as you browse with your AI explainer</h1>
        <p className={styles.subheading}>You found us at the right time. Exclusive launch discounts won't last forever.</p>

        {/* Billing Period Toggle */}
        {(() => {
          // Calculate max yearly discount
          const maxYearlyDiscount = Math.max(
            ...yearlyPrices
              .filter(p => p.discountPercentage)
              .map(p => p.discountPercentage || 0)
          );
          
          return (
            <div className={styles.billingToggle}>
              <button
                className={`${styles.toggleButton} ${billingPeriod === 'yearly' ? styles.toggleButtonActive : ''}`}
                onClick={() => setBillingPeriod('yearly')}
              >
                Yearly
                {maxYearlyDiscount > 0 && (
                  <span className={styles.toggleDiscount}>{maxYearlyDiscount}% OFF</span>
                )}
              </button>
              <button
                className={`${styles.toggleButton} ${billingPeriod === 'monthly' ? styles.toggleButtonActive : ''}`}
                onClick={() => setBillingPeriod('monthly')}
              >
                Monthly
              </button>
            </div>
          );
        })()}

        <div className={styles.cards}>
          {/* Free Trial Card */}
          <div className={`${styles.card} ${styles.cardFree}`}>
            <div className={styles.cardTitleContainer}>
              <h2 className={styles.cardTitle}>Free Trial</h2>
            </div>
            
            <div className={styles.price}>
              <div className={styles.priceContainer}>
                <div className={styles.priceAmount}>{currentPrices[0]?.currencySymbol || '$'}0</div>
                <div className={styles.pricePeriod}>forever</div>
              </div>
            </div>

            <p className={styles.description}>
              Perfect for trying out the platform.
            </p>

            <button 
              className={`${styles.buttonSecondary} ${isLoggedIn ? styles.disabledButton : ''}`}
              onClick={handleFreeTrialClick}
              disabled={isLoggedIn}
            >
              {isLoggedIn ? 'Current Plan' : 'Get started'}
            </button>

            {/* No credit card required text */}
            <p className={styles.cancelAnytime}>No card required</p>

            {/* Features List */}
            <ul className={styles.featuresList}>
              {freeTrialFeatures.map((feature, idx) => {
                // First 7 features (up to 'Revisit your reading history') get teal dot
                const isIncluded = idx <= 6;
                return (
                  <li key={idx} className={`${styles.featureItem} ${!isIncluded ? styles.featureExcluded : ''}`}>
                    {isIncluded ? (
                      <span className={styles.featureDot}>•</span>
                    ) : (
                      <XIcon className={styles.featureCross} size={14} />
                    )}
                    {feature}
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Dynamic Paid Plan Cards - sorted by price (highest first = featured) */}
          {sortedPlans.map((price, index) => {
            const isYearly = price.billingInterval === 'year';
            const isFeatured = index === 0; // Highest priced plan is featured
            const planName = getBasePlanName(price.name);
            
            return (
              <div 
                key={price.id} 
                className={`${styles.card} ${isFeatured ? styles.cardUltra : ''}`}
              >
                {/* Most Popular Badge - only for featured plan */}
                {isFeatured && <div className={styles.popularBadge}>Most Popular</div>}
                
                {/* Plan Name with Discount Badge */}
                <div className={styles.cardTitleContainer}>
                  <h2 className={styles.cardTitle}>{planName}</h2>
                  {price.hasDiscount && price.discountPercentage && (price.discountPercentage ?? 0) > 0 && (
                    <span className={styles.titleDiscountBadge}>
                      {price.discountPercentage}% OFF
                    </span>
                  )}
                </div>
                
                {/* Price Display */}
                <div className={styles.price}>
                  <div className={styles.priceContainer}>
                    {/* For yearly: show monthly equivalent prices */}
                    {isYearly ? (
                      <>
                        <div className={styles.priceRow}>
                          {price.hasDiscount && (price.discountPercentage ?? 0) > 0 && price.formattedOriginalMonthlyEquivalent && (
                            <>
                              <span className={styles.originalPrice}>
                                {price.formattedOriginalMonthlyEquivalent}
                              </span>
                              <span className={styles.priceArrow}>→</span>
                            </>
                          )}
                          <span className={styles.priceAmount}>
                            {price.formattedMonthlyEquivalent}
                          </span>
                        </div>
                        <div className={styles.pricePeriod}>per month</div>
                        <div className={styles.billedAnnually}>billed annually · {price.description}</div>
                      </>
                    ) : (
                      <>
                        <div className={styles.priceRow}>
                          {price.hasDiscount && (price.discountPercentage ?? 0) > 0 && price.formattedOriginalPrice && (
                            <>
                              <span className={styles.originalPrice}>
                                {price.formattedOriginalPrice}
                              </span>
                              <span className={styles.priceArrow}>→</span>
                            </>
                          )}
                          <span className={styles.priceAmount}>
                            {price.formattedPrice}
                          </span>
                        </div>
                        <div className={styles.pricePeriod}>
                          {price.formattedBillingCycle}
                        </div>
                        <div className={styles.billedAnnually}>{price.description}</div>
                      </>
                    )}
                  </div>
                </div>

                {/* CTA Button - Primary for featured, Secondary for others */}
                <button 
                  className={isFeatured ? styles.buttonPrimary : styles.buttonSecondary}
                  onClick={() => handleGetStarted(price)}
                  disabled={checkoutLoading === price.id}
                >
                  {getButtonText(price)}
                </button>

                {/* Cancel anytime text */}
                <p className={styles.cancelAnytime}>Cancel anytime</p>

                {/* Features List */}
                <ul className={styles.featuresList}>
                  {(isFeatured ? ultraFeatures : plusFeatures).map((feature, idx) => {
                    // For Plus plan: last 3 features (bookmark, PDF, collaboration) get cross icon
                    const isExcluded = !isFeatured && idx >= 5;
                    return (
                      <li key={idx} className={`${styles.featureItem} ${isExcluded ? styles.featureExcluded : ''}`}>
                        {isExcluded ? (
                          <XIcon className={styles.featureCross} size={14} />
                        ) : (
                          <CheckIcon className={styles.featureIcon} size={16} />
                        )}
                        {feature}
                      </li>
                    );
                  })}
                </ul>
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

      {/* Login Modal with Overlay - portaled to body so position:fixed is viewport-relative (avoids PageContent fadeIn transform containing block) */}
      {(showLoginModal || isModalClosing) &&
        createPortal(
          <>
            <div
              className={`${styles.modalOverlay} ${isModalClosing ? styles.modalOverlayClosing : ''}`}
              onClick={handleCloseModal}
            />
            <div
              className={`${styles.modalContainer} ${isModalClosing ? styles.modalContainerClosing : ''}`}
              onClick={(e) => e.stopPropagation()}
            >
              <LoginModal
                actionText={freeTrialLoginRef.current ? 'start your free trial' : 'subscribe to a plan'}
                onClose={handleCloseModal}
              />
            </div>
          </>,
          document.body
        )}
    </div>
  );
};

Pricing.displayName = 'Pricing';
