import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FiCreditCard, 
  FiCalendar, 
  FiClock, 
  FiAlertCircle,
  FiRefreshCw,
  FiXCircle
} from 'react-icons/fi';
import { FaCrown } from 'react-icons/fa';
import styles from './SubscriptionTab.module.css';
import { useAuth } from '@/shared/hooks/useAuth';
import { usePaddle } from '@/shared/hooks/usePaddle';
import { getUserSubscriptionStatus } from '@/shared/services/subscription.service';
import { Toast } from '@/shared/components/Toast';
import { 
  SubscriptionStatus,
  getPlanName,
  formatSubscriptionPrice,
  getSubscriptionStatusEnum,
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
 * SubscriptionTab - User subscription management tab
 * 
 * @returns JSX element
 */
export const SubscriptionTab: React.FC = () => {
  const { user } = useAuth();
  const { yearlyPrices } = usePaddle();
  const [loading, setLoading] = useState(true);
  const [subscriptionData, setSubscriptionData] = useState<GetUserSubscriptionResponse | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Find Ultra yearly price for upgrade button
  const ultraYearlyPrice = yearlyPrices.find(p => p.name?.toUpperCase().includes('ULTRA'));

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
              <Link to="/pricing" className={styles.upgradeButton}>
                <FaCrown size={20} />
                Upgrade to Ultra Yearly
              </Link>
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
  const planName = getPlanName(subscription);
  const formattedPrice = formatSubscriptionPrice(subscription);
  const statusEnum = getSubscriptionStatusEnum(subscription.status);

  // Case 2: Subscription exists but is not active (expired/canceled/past_due)
  if (!has_active_subscription) {
    return (
      <div className={styles.subscriptionTab}>
        <div className={styles.content}>
          <div className={styles.expiredSubscription}>
            <div className={styles.expiredHeader}>
              <p className={styles.sectionLabel}>Your current plan</p>
              {planName && (
                <span className={styles.planNameLarge}>{planName}</span>
              )}
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
            {planName && (
              <span className={styles.planNameLarge}>{planName}</span>
            )}
          </div>
          
          {formattedPrice && (
            <p className={styles.planPrice}>{formattedPrice}</p>
          )}

          {/* Subscription Details */}
          <div className={styles.details}>
            {subscription.current_billing_period_starts_at && subscription.current_billing_period_ends_at && (
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>
                  <FiCalendar className={styles.detailIcon} size={18} />
                  Current Period
                </span>
                <span className={styles.detailValue}>
                  {formatDate(subscription.current_billing_period_starts_at)} - {formatDate(subscription.current_billing_period_ends_at)}
                </span>
              </div>
            )}

            {subscription.next_billed_at && statusEnum === SubscriptionStatus.ACTIVE && (
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>
                  <FiClock className={styles.detailIcon} size={18} />
                  Next Billing Date
                </span>
                <span className={styles.detailValue}>
                  {formatDate(subscription.next_billed_at)}
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

          <div className={styles.divider} />

          {/* Ultra Benefits for Plus subscribers */}
          {planName?.toUpperCase().startsWith('PLUS') && (
            <div className={styles.ultraBenefits}>
              <p className={styles.ultraBenefitsTitle}>
                <FaCrown size={14} />
                Unlock more with Ultra
              </p>
              <ul className={styles.ultraBenefitsList}>
                <li>Save any page, summary, passage & images to your dashboard that come across your browsing</li>
                <li>Get back to the original source of the content you saved in one click</li>
                <li>Chat with saved content to quickly revise your learnings</li>
                <li>Create your own notes form saved content</li>
              </ul>
            </div>
          )}

          {/* Actions */}
          <div className={styles.actions}>
            {/* Show Upgrade button for Plus plans, View Plans for others */}
            {planName?.toUpperCase().startsWith('PLUS') ? (
              <Link to="/pricing" className={styles.upgradeButton}>
                <FaCrown size={20} />
                Upgrade to Ultra
              </Link>
            ) : (
              <Link to="/pricing" className={styles.viewPlansButton}>
                View All Plans
              </Link>
            )}
            
            {/* Cancel subscription button (icon only) */}
            <button className={styles.cancelButton}>
              <FiXCircle size={18} />
            </button>
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
};

SubscriptionTab.displayName = 'SubscriptionTab';
