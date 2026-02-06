import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FiCreditCard, 
  FiCalendar, 
  FiClock, 
  FiAlertCircle,
  FiRefreshCw,
  FiXCircle,
  FiLoader,
  FiX
} from 'react-icons/fi';
import { FaCrown } from 'react-icons/fa';
import styles from './SubscriptionTab.module.css';
import { useAuth } from '@/shared/hooks/useAuth';
import { usePaddle } from '@/shared/hooks/usePaddle';
import { paddleConfig } from '@/shared/config/paddle.config';
import { getUserSubscriptionStatus, cancelSubscription, updateSubscription } from '@/shared/services/subscription.service';
import { Toast } from '@/shared/components/Toast';
import { 
  SubscriptionStatus,
  getPlanName,
  formatSubscriptionPrice,
  getSubscriptionStatusEnum,
  getNextBilledAt,
  getPreviouslyBilledAt,
} from '@/shared/types/subscription.types';
import type { GetUserSubscriptionResponse } from '@/shared/types/subscription.types';

/**
 * Format date for display
 */
const formatDate = (dateString: string | null): string => {
  if (!dateString) return 'N/A';
  
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

/**
 * Cancellation reasons configuration
 */
const CANCELLATION_REASONS = [
  {
    id: 'TOO_EXPENSIVE',
    label: "It's too expensive for me",
    feedbackPrompt: 'What price point would work better for you?'
  },
  {
    id: 'NOT_USING',
    label: "I'm not using it enough",
    feedbackPrompt: 'What prevented you from using Xplaino more?'
  },
  {
    id: 'FOUND_ALTERNATIVE',
    label: 'I found a better alternative',
    feedbackPrompt: 'Which alternative did you find? What made it better?'
  },
  {
    id: 'MISSING_FEATURES',
    label: "It's missing features I need",
    feedbackPrompt: 'What features would you like us to add?'
  },
  {
    id: 'EXTENSION_NOT_WORKING',
    label: 'The extension is not working properly',
    feedbackPrompt: 'What issues are you experiencing with the extension?'
  },
  {
    id: 'OTHER',
    label: 'Other reason',
    feedbackPrompt: 'Please tell us more about why you are leaving'
  }
];


/**
 * SubscriptionTab - User subscription management tab
 * 
 * @returns JSX element
 */
export const SubscriptionTab: React.FC = () => {
  const { user } = useAuth();
  const { yearlyPrices, openCheckout } = usePaddle();
  const [loading, setLoading] = useState(true);
  const [subscriptionData, setSubscriptionData] = useState<GetUserSubscriptionResponse | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [refreshingSubscription, setRefreshingSubscription] = useState(false);
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [userFeedback, setUserFeedback] = useState('');
  const [feedbackPrompt, setFeedbackPrompt] = useState('');
  const [isModalClosing, setIsModalClosing] = useState(false);

  // Find Ultra yearly price for upgrade button
  const ultraYearlyPrice = yearlyPrices.find(p => p.name?.toUpperCase().includes('ULTRA'));

  // Handle upgrade button click - call update API for existing subscribers, Paddle checkout for new
  const handleUpgradeClick = async () => {
    if (!ultraYearlyPrice) return;
    
    const paddleSubscriptionId = subscriptionData?.subscription?.paddle_subscription_id;
    
    try {
      setCheckoutLoading(true);
      
      // If user has an active subscription, use the update API
      if (paddleSubscriptionId && subscriptionData?.has_active_subscription) {
        await updateSubscription(paddleSubscriptionId, [
          { price_id: ultraYearlyPrice.id, quantity: 1 }
        ]);
        
        // Show success and refresh subscription data
        setToast({ 
          message: 'Subscription upgraded successfully!', 
          type: 'success' 
        });
        
        // Show refreshing state and fetch updated data
        setRefreshingSubscription(true);
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        if (user?.id) {
          const data = await getUserSubscriptionStatus(user.id);
          setSubscriptionData(data);
        }
        setRefreshingSubscription(false);
      } else {
        // For users without subscription (FREE TRIAL), open Paddle checkout
        const discountId = paddleConfig.discountIds.yearly.ultra || undefined;
        await openCheckout(
          ultraYearlyPrice.id,
          discountId,
          { allowLogout: false },
          { email: user!.email },
          { userId: user!.id }
        );
      }
    } catch (err) {
      setToast({ 
        message: err instanceof Error ? err.message : 'Failed to upgrade subscription', 
        type: 'error' 
      });
      setRefreshingSubscription(false);
    } finally {
      setCheckoutLoading(false);
    }
  };

  // Handle cancel subscription
  // Handle reason checkbox change
  const handleReasonChange = (reasonId: string, checked: boolean) => {
    let newReasons: string[];
    if (checked) {
      newReasons = [...selectedReasons, reasonId];
      // Update feedback prompt based on last selected reason
      const reason = CANCELLATION_REASONS.find(r => r.id === reasonId);
      if (reason) {
        setFeedbackPrompt(reason.feedbackPrompt);
      }
    } else {
      newReasons = selectedReasons.filter(r => r !== reasonId);
      // Update feedback prompt to the last remaining reason, or clear if none
      if (newReasons.length > 0) {
        const lastReason = CANCELLATION_REASONS.find(r => r.id === newReasons[newReasons.length - 1]);
        if (lastReason) {
          setFeedbackPrompt(lastReason.feedbackPrompt);
        }
      } else {
        setFeedbackPrompt('');
      }
    }
    setSelectedReasons(newReasons);
  };

  // Reset cancel modal state
  const resetCancelModal = () => {
    setIsModalClosing(true);
    setTimeout(() => {
      setShowCancelConfirm(false);
      setSelectedReasons([]);
      setUserFeedback('');
      setFeedbackPrompt('');
      setIsModalClosing(false);
    }, 250); // Match the animation duration
  };

  const handleCancelSubscription = async () => {
    const subscription = subscriptionData?.subscription;
    if (!subscription?.paddle_subscription_id) return;
    
    try {
      setCancelLoading(true);
      await cancelSubscription(subscription.paddle_subscription_id, {
        reasons: selectedReasons,
        user_feedback: userFeedback
      });
      resetCancelModal();
      
      // Show refreshing state
      setRefreshingSubscription(true);
      
      // Wait 3 seconds before fetching updated data
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Fetch updated subscription data
      if (user?.id) {
        const data = await getUserSubscriptionStatus(user.id);
        setSubscriptionData(data);
      }
      
      setToast({ message: 'Subscription canceled successfully', type: 'success' });
    } catch (err) {
      setToast({ 
        message: err instanceof Error ? err.message : 'Failed to cancel subscription', 
        type: 'error' 
      });
    } finally {
      setCancelLoading(false);
      setRefreshingSubscription(false);
    }
  };

  // Fetch subscription status on mount
  useEffect(() => {
    const fetchSubscriptionStatus = async () => {
      if (!user?.id) return;

      try {
        setLoading(true);
        const data = await getUserSubscriptionStatus(user.id);
        setSubscriptionData(data);
      } catch (error) {
        console.error('Error fetching subscription status:', error);
        setToast({ 
          message: error instanceof Error ? error.message : 'Failed to load subscription data', 
          type: 'error' 
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSubscriptionStatus();
  }, [user?.id]);

  if (loading) {
    return (
      <div className={styles.subscriptionTab}>
        <div className={styles.loading}>Loading subscription...</div>
      </div>
    );
  }

  // Show refreshing state after cancel
  if (refreshingSubscription) {
    return (
      <div className={styles.subscriptionTab}>
        <div className={styles.content}>
          <div className={styles.refreshingState}>
            <FiLoader className={styles.spinnerIcon} size={32} />
            <p>Fetching updated subscription...</p>
          </div>
        </div>
      </div>
    );
  }

  // Case 1: No subscription at all - show upgrade UI
  if (!subscriptionData?.subscription) {
    return (
      <div className={styles.subscriptionTab}>
        <div className={styles.content}>
          <div className={styles.noSubscription}>
            {/* Header with FREE TRIAL badge */}
            <div className={styles.noSubHeader}>
              <p className={styles.sectionLabel}>Your current plan</p>
              <span className={styles.freeTrialBadge}>FREE TRIAL</span>
            </div>

            {/* Best plan recommendation */}
            <div className={styles.bestPlanRow}>
              <span className={styles.bestPlanText}>Best plan for you</span>
              <span className={styles.bestPlanName}>ULTRA YEARLY</span>
              {ultraYearlyPrice?.discountPercentage && (
                <div className={styles.offerGroup}>
                  <span className={styles.discountBadge}>
                    {ultraYearlyPrice.discountPercentage}% OFF
                  </span>
                  <span className={styles.limitedOffer}>Limited offer!</span>
                </div>
              )}
            </div>

            {/* Ultra Features */}
            <div className={styles.ultraBenefits}>
              <p className={styles.ultraBenefitsTitle}>
                <FaCrown size={14} />
                Unlock Ultra features
              </p>
              <ul className={styles.ultraBenefitsList}>
                <li>Unlimited page summaries & AI chat</li>
                <li>Unlimited text & image explanations</li>
                <li>Results in your native language</li>
                <li>Unlimited page translations in 60+ languages</li>
                <li>Unlimited contextual word meanings & vocabulary</li>
                <li>Revisit your reading history</li>
                <li>Unlimited bookmarks with source links</li>
                <li>Unlimited notes & AI chat</li>
                <li>Priority support anytime</li>
              </ul>
            </div>

            {/* Actions */}
            <div className={styles.noSubActions}>
              <button 
                className={styles.upgradeButton}
                onClick={handleUpgradeClick}
                disabled={checkoutLoading}
              >
                <FaCrown size={20} />
                {checkoutLoading ? 'Loading...' : 'Upgrade to Ultra Yearly'}
              </button>
              <Link to="/pricing" className={styles.viewAllPlansLink}>
                View All Plans
              </Link>
            </div>
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
  }

  const { subscription, has_active_subscription } = subscriptionData;
  const planNameFromItems = getPlanName(subscription);
  const formattedPrice = formatSubscriptionPrice(subscription);
  const statusEnum = getSubscriptionStatusEnum(subscription.status);

  // Derive plan name from available data when items is empty
  const derivePlanName = (): string => {
    if (planNameFromItems) return planNameFromItems.toUpperCase();
    
    // Fallback: derive from billing_cycle_interval
    const interval = subscription.billing_cycle_interval?.toUpperCase();
    if (interval === 'YEAR') return 'YEARLY PLAN';
    if (interval === 'MONTH') return 'MONTHLY PLAN';
    return 'ACTIVE PLAN';
  };

  const planName = derivePlanName();
  const isYearlyPlan = subscription.billing_cycle_interval?.toUpperCase() === 'YEAR';
  const isMonthlyPlan = subscription.billing_cycle_interval?.toUpperCase() === 'MONTH';

  // Determine current plan type for conditional UI (from items if available)
  const isUltraYearly = planNameFromItems?.toUpperCase() === 'ULTRA YEARLY';
  const isUltraMonthly = planNameFromItems?.toUpperCase() === 'ULTRA MONTHLY';
  const isPlusPlan = planNameFromItems?.toUpperCase().startsWith('PLUS');
  
  // If items is empty, we don't know the exact plan - show upgrade options
  const hasUnknownPlan = !planNameFromItems;
  
  // Get billing dates with fallback to item-level data
  const nextBilledAt = getNextBilledAt(subscription);
  const previouslyBilledAt = getPreviouslyBilledAt(subscription);
  
  // Check if next billing date exists - only show cancel button if it does
  const hasNextBillingDate = !!nextBilledAt;

  // Case 2: Subscription exists but is not active (expired/canceled/past_due)
  if (!has_active_subscription) {
    return (
      <div className={styles.subscriptionTab}>
        <div className={styles.content}>
          <div className={styles.expiredSubscription}>
            <div className={styles.expiredHeader}>
              <p className={styles.sectionLabel}>Your current plan</p>
              <span className={styles.planNameLarge}>
                {planName || 'EXPIRED PLAN'}
              </span>
            </div>
            
            <div className={styles.expiredContent}>
              <FiAlertCircle className={styles.expiredIcon} size={40} />
              <h3 className={styles.expiredTitle}>Subscription Expired</h3>
              <p className={styles.expiredText}>
                Renew your subscription to continue enjoying premium features.
              </p>
              
              {subscription.canceled_at && (
                <p className={styles.expiredDate}>
                  Canceled on {formatDate(subscription.canceled_at)}
                </p>
              )}
            </div>

            <div className={styles.expiredActions}>
              <button className={styles.renewButton}>
                <FiRefreshCw size={18} />
                Renew current plan
              </button>
              <Link to="/pricing" className={styles.secondaryButton}>
                View All Plans
              </Link>
            </div>
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
  }

  // Case 3: Active subscription
  return (
    <div className={styles.subscriptionTab}>
      <div className={styles.content}>
        <div className={styles.subscriptionCard}>
          {/* Header with label and plan name */}
          <div className={styles.activeHeader}>
            <p className={styles.sectionLabel}>Your current plan</p>
            <span className={`${styles.planNameLarge} ${isPlusPlan ? styles.planNamePlus : ''}`}>
              {planName}
            </span>
          </div>
          
          {formattedPrice && (
            <p className={styles.planPrice}>{formattedPrice}</p>
          )}
          
          {/* Show billing interval if no price available */}
          {!formattedPrice && subscription.currency_code && (
            <p className={styles.planPrice}>
              {subscription.currency_code} / {isYearlyPlan ? 'year' : isMonthlyPlan ? 'month' : 'period'}
            </p>
          )}

          {/* Subscription Details */}
          <div className={styles.details}>
            {/* Current Period - use top-level or fallback to item-level dates */}
            {(subscription.current_billing_period_starts_at && subscription.current_billing_period_ends_at) ? (
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>
                  <FiCalendar className={styles.detailIcon} size={18} />
                  Current Period
                </span>
                <span className={styles.detailValue}>
                  {formatDate(subscription.current_billing_period_starts_at)} - {formatDate(subscription.current_billing_period_ends_at)}
                </span>
              </div>
            ) : (previouslyBilledAt && nextBilledAt) && (
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>
                  <FiCalendar className={styles.detailIcon} size={18} />
                  Current Period
                </span>
                <span className={styles.detailValue}>
                  {formatDate(previouslyBilledAt)} - {formatDate(nextBilledAt)}
                </span>
              </div>
            )}

            {/* Next Billing Date - use fallback helper */}
            {nextBilledAt && statusEnum === SubscriptionStatus.ACTIVE && (
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>
                  <FiClock className={styles.detailIcon} size={18} />
                  Next Billing Date
                </span>
                <span className={styles.detailValue}>
                  {formatDate(nextBilledAt)}
                </span>
              </div>
            )}

            {subscription.created_at && (
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>
                  <FiCreditCard className={styles.detailIcon} size={18} />
                  Member Since
                </span>
                <span className={styles.detailValue}>
                  {formatDate(subscription.created_at)}
                </span>
              </div>
            )}
          </div>

          {/* Cancellation notice when subscription won't auto-renew */}
          {!hasNextBillingDate && (
            <div className={styles.cancellationNotice}>
              <h3 className={styles.cancellationHeading}>
                <FiAlertCircle size={20} />
                Subscription Cancelled
              </h3>
              <p className={styles.cancellationMessage}>
                Your <strong>{planName}</strong> subscription has been cancelled. You will <strong>not be charged</strong> from the next billing cycle onwards.
                {(subscription.current_billing_period_ends_at || previouslyBilledAt) && (
                  <> However, you can continue using all your premium features until <strong>{formatDate(subscription.current_billing_period_ends_at || null)}</strong>, as your current billing period is still active.</>
                )}
              </p>
              <p className={styles.cancellationNoRefund}>
                Please note that cancellations do not include a refund for the current billing period. For more details, please review our{' '}
                <Link to="/refund-policy" className={styles.refundPolicyLink}>Refund Policy</Link>.
              </p>
              {subscription.canceled_at && (
                <p className={styles.cancellationDate}>
                  Cancelled on {formatDate(subscription.canceled_at)}
                </p>
              )}
            </div>
          )}

          <div className={styles.divider} />

          {/* Actions - conditional based on plan */}
          <div className={styles.actions}>
            {/* Ultra Yearly - only cancel button */}
            {isUltraYearly && hasNextBillingDate && (
              <button 
                className={styles.cancelButton}
                onClick={() => setShowCancelConfirm(true)}
              >
                <FiXCircle size={18} />
              </button>
            )}

            {/* Ultra Monthly - upgrade to yearly */}
            {isUltraMonthly && (
              <>
                <button 
                  className={styles.upgradeButton}
                  onClick={handleUpgradeClick}
                  disabled={checkoutLoading}
                >
                  <FaCrown size={20} />
                  {checkoutLoading ? 'Loading...' : `Upgrade to Yearly for ${ultraYearlyPrice?.discountPercentage || ''}% OFF`}
                </button>
                {hasNextBillingDate && (
                  <button 
                    className={styles.cancelButton}
                    onClick={() => setShowCancelConfirm(true)}
                  >
                    <FiXCircle size={18} />
                  </button>
                )}
              </>
            )}

            {/* Plus plans - cancel button here before suggested plan */}
            {isPlusPlan && hasNextBillingDate && (
              <button 
                className={styles.cancelButton}
                onClick={() => setShowCancelConfirm(true)}
              >
                <FiXCircle size={18} />
              </button>
            )}

            {/* Unknown plan (items empty) - show upgrade options based on billing interval */}
            {hasUnknownPlan && isMonthlyPlan && (
              <>
                <button 
                  className={styles.upgradeButton}
                  onClick={handleUpgradeClick}
                  disabled={checkoutLoading}
                >
                  <FaCrown size={20} />
                  {checkoutLoading ? 'Loading...' : `Upgrade to Yearly for ${ultraYearlyPrice?.discountPercentage || '30'}% OFF`}
                </button>
                {hasNextBillingDate && (
                  <button 
                    className={styles.cancelButton}
                    onClick={() => setShowCancelConfirm(true)}
                  >
                    <FiXCircle size={18} />
                  </button>
                )}
              </>
            )}

            {/* Unknown yearly plan - just show cancel and view plans */}
            {hasUnknownPlan && isYearlyPlan && (
              <>
                <Link to="/pricing" className={styles.viewPlansButton}>
                  View All Plans
                </Link>
                {hasNextBillingDate && (
                  <button 
                    className={styles.cancelButton}
                    onClick={() => setShowCancelConfirm(true)}
                  >
                    <FiXCircle size={18} />
                  </button>
                )}
              </>
            )}

            {/* Fallback if no billing interval info */}
            {hasUnknownPlan && !isMonthlyPlan && !isYearlyPlan && (
              <>
                <Link to="/pricing" className={styles.viewPlansButton}>
                  View All Plans
                </Link>
                {hasNextBillingDate && (
                  <button 
                    className={styles.cancelButton}
                    onClick={() => setShowCancelConfirm(true)}
                  >
                    <FiXCircle size={18} />
                  </button>
                )}
              </>
            )}
          </div>

          {/* Ultra Benefits for Plus subscribers */}
          {isPlusPlan && (
            <>
              {/* Best plan recommendation */}
              <div className={styles.bestPlanRow}>
                <span className={styles.bestPlanText}>Best plan for you</span>
                <span className={styles.bestPlanName}>ULTRA YEARLY</span>
                {ultraYearlyPrice?.discountPercentage && (
                  <div className={styles.offerGroup}>
                    <span className={styles.discountBadge}>
                      {ultraYearlyPrice.discountPercentage}% OFF
                    </span>
                    <span className={styles.limitedOffer}>Limited offer!</span>
                  </div>
                )}
              </div>

              {/* Extra Ultra Features (compared to Plus) */}
              <div className={styles.ultraBenefits}>
                <p className={styles.ultraBenefitsTitle}>
                  <FaCrown size={14} />
                  What's extra in Ultra
                </p>
                <ul className={styles.ultraBenefitsList}>
                  <li>Save any page, summary, passage & images to your dashboard that come across your browsing</li>
                  <li>Get back to the original source of the content you saved in one click</li>
                  <li>Chat with saved content to quickly revise your learnings</li>
                  <li>Create your own notes from saved content</li>
                </ul>
              </div>

              {/* Upgrade actions - buttons on opposite ends */}
              <div className={styles.plusUpgradeActions}>
                <button 
                  className={styles.upgradeButton}
                  onClick={handleUpgradeClick}
                  disabled={checkoutLoading}
                >
                  <FaCrown size={20} />
                  {checkoutLoading ? 'Loading...' : 'Upgrade to Ultra Yearly'}
                </button>
                <Link to="/pricing" className={styles.viewAllPlansLink}>
                  View All Plans
                </Link>
              </div>
            </>
          )}

          {/* Upgrade section for unknown monthly plans */}
          {hasUnknownPlan && isMonthlyPlan && (
            <>
              {/* Best plan recommendation */}
              <div className={styles.bestPlanRow}>
                <span className={styles.bestPlanText}>Best plan for you</span>
                <span className={styles.bestPlanName}>ULTRA YEARLY</span>
                {ultraYearlyPrice?.discountPercentage && (
                  <div className={styles.offerGroup}>
                    <span className={styles.discountBadge}>
                      {ultraYearlyPrice.discountPercentage}% OFF
                    </span>
                    <span className={styles.limitedOffer}>Limited offer!</span>
                  </div>
                )}
              </div>

              {/* Ultra Features */}
              <div className={styles.ultraBenefits}>
                <p className={styles.ultraBenefitsTitle}>
                  <FaCrown size={14} />
                  Unlock Ultra features
                </p>
                <ul className={styles.ultraBenefitsList}>
                  <li>Unlimited page summaries & AI chat</li>
                  <li>Unlimited text & image explanations</li>
                  <li>Results in your native language</li>
                  <li>Unlimited page translations in 60+ languages</li>
                  <li>Unlimited contextual word meanings & vocabulary</li>
                  <li>Revisit your reading history</li>
                  <li>Unlimited bookmarks with source links</li>
                  <li>Unlimited notes & AI chat</li>
                  <li>Priority support anytime</li>
                </ul>
              </div>

              {/* Upgrade actions */}
              <div className={styles.plusUpgradeActions}>
                <button 
                  className={styles.upgradeButton}
                  onClick={handleUpgradeClick}
                  disabled={checkoutLoading}
                >
                  <FaCrown size={20} />
                  {checkoutLoading ? 'Loading...' : 'Upgrade to Ultra Yearly'}
                </button>
                <Link to="/pricing" className={styles.viewAllPlansLink}>
                  View All Plans
                </Link>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && (
        <div 
          className={`${styles.cancelModal} ${isModalClosing ? styles.modalClosing : ''}`} 
          onClick={resetCancelModal}
        >
          <div 
            className={`${styles.cancelModalContent} ${isModalClosing ? styles.modalContentClosing : ''}`} 
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              className={styles.modalCloseButton}
              onClick={resetCancelModal}
              aria-label="Close modal"
            >
              <FiX size={20} />
            </button>
            <h3>Cancel Subscription</h3>
            <p>We're sorry to see you go. Please let us know why you're canceling so we can improve.</p>
            
            <div className={styles.cancelReasonsList}>
              {CANCELLATION_REASONS.map((reason) => (
                <label key={reason.id} className={styles.cancelReasonItem}>
                  <input
                    type="checkbox"
                    className={styles.cancelReasonCheckbox}
                    checked={selectedReasons.includes(reason.id)}
                    onChange={(e) => handleReasonChange(reason.id, e.target.checked)}
                    disabled={cancelLoading}
                  />
                  <span>{reason.label}</span>
                </label>
              ))}
            </div>

            {selectedReasons.length > 0 && (
              <div className={styles.cancelFeedbackSection}>
                <label className={styles.cancelFeedbackPrompt}>
                  {feedbackPrompt} <span className={styles.requiredAsterisk}>*</span>
                </label>
                <textarea
                  className={styles.cancelFeedbackTextarea}
                  value={userFeedback}
                  onChange={(e) => setUserFeedback(e.target.value)}
                  placeholder="Your feedback helps us improve..."
                  disabled={cancelLoading}
                  rows={3}
                />
              </div>
            )}

            <div className={styles.cancelModalActions}>
              <button 
                className={styles.continueButton}
                onClick={resetCancelModal}
                disabled={cancelLoading}
              >
                Continue with Xplaino
              </button>
              <button 
                className={styles.cancelModalConfirm}
                onClick={handleCancelSubscription}
                disabled={cancelLoading || selectedReasons.length === 0 || !userFeedback.trim()}
              >
                {cancelLoading ? 'Canceling...' : 'Cancel Subscription'}
              </button>
            </div>
          </div>
        </div>
      )}

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

SubscriptionTab.displayName = 'SubscriptionTab';
