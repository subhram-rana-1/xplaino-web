import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './HighlightedCoupon.module.css';
import { usePaddle } from '@/shared/hooks/usePaddle';

interface HighlightedCouponProps {
  onDismiss?: () => void;
  placement?: 'banner' | 'sidebar';
}

const FOMO_TIMER_KEY = 'xplaino_fomo_timer_expiry';

/**
 * Strip "Monthly" or "Yearly" suffix from a plan name
 */
const getBasePlanName = (name: string): string => {
  return name.replace(/\s*(Monthly|Yearly)\s*/gi, '').trim();
};

/**
 * Generate a random FOMO expiry time roughly ~3 days from now.
 * Uses a non-round hour count (e.g., 67-74 hours) so it looks natural.
 */
const generateFomoExpiry = (): number => {
  const minHours = 67;
  const maxHours = 74;
  const randomHours = minHours + Math.random() * (maxHours - minHours);
  // Add an extra random minutes offset so the seconds don't land on :00
  const extraMinutes = Math.floor(Math.random() * 47) + 7; // 7-53 extra minutes
  return Date.now() + (randomHours * 60 + extraMinutes) * 60 * 1000;
};

/**
 * Get or create a FOMO expiry timestamp.
 * Stored in localStorage so it survives tab closes and persists for the full ~3 day window.
 * Once the timer expires, a fresh one is generated on the next visit.
 */
const getFomoExpiry = (): number => {
  try {
    const stored = localStorage.getItem(FOMO_TIMER_KEY);
    if (stored) {
      const expiry = parseInt(stored, 10);
      if (!isNaN(expiry) && expiry > Date.now()) {
        return expiry;
      }
    }
    const expiry = generateFomoExpiry();
    localStorage.setItem(FOMO_TIMER_KEY, expiry.toString());
    return expiry;
  } catch {
    // localStorage may be unavailable (e.g., incognito in some browsers)
    return generateFomoExpiry();
  }
};

/**
 * HighlightedCoupon - Displays discount banner above navbar using Paddle pricing data.
 * Shows the maximum available discount across all plans in a FOMO style.
 * Visible for all users (logged-in or not, any subscription tier).
 *
 * @returns JSX element or null if no discounts available
 */
export const HighlightedCoupon: React.FC<HighlightedCouponProps> = ({ onDismiss: _onDismiss, placement = 'banner' }) => {
  const { monthlyPrices, yearlyPrices, isLoading, error } = usePaddle();
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const navigate = useNavigate();

  // Compute the best (maximum) discount across all Paddle prices
  const bestDeal = useMemo(() => {
    const allPrices = [...monthlyPrices, ...yearlyPrices];
    const discounted = allPrices.filter(
      (p) => p.hasDiscount && p.discountPercentage && p.discountPercentage > 0
    );

    if (discounted.length === 0) return null;

    // Find the price with the highest discount percentage
    const best = discounted.reduce((max, p) =>
      (p.discountPercentage! > max.discountPercentage!) ? p : max
    );

    return {
      discountPercentage: best.discountPercentage!,
      planName: getBasePlanName(best.name),
      currencySymbol: best.currencySymbol,
      discountAmount: best.discountAmount!,
      formattedSavings: `${best.currencySymbol}${Math.floor(best.discountAmount!).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
    };
  }, [monthlyPrices, yearlyPrices]);

  // Session-based FOMO countdown timer
  useEffect(() => {
    if (!bestDeal) return;

    const fomoExpiry = getFomoExpiry();

    const updateCountdown = () => {
      const now = Date.now();
      const diff = fomoExpiry - now;

      if (diff <= 0) {
        setTimeRemaining('Ending soon!');
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (days > 0) {
        setTimeRemaining(`${days}d ${hours}h ${minutes}m ${seconds}s`);
      } else if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
      } else {
        setTimeRemaining(`${minutes}m ${seconds}s`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [bestDeal]);

  const handleGoToPricing = () => {
    navigate('/pricing');
  };

  // Don't render if loading, error, or no discounts available
  if (isLoading || error || !bestDeal) {
    return null;
  }

  return (
    <div className={placement === 'sidebar' ? styles.bannerSidebar : styles.banner}>
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.leftSection}>
            <div className={styles.discountBadge}>
              <span className={styles.discountValue}>{bestDeal.discountPercentage}%</span>
              <span className={styles.discountOff}>OFF</span>
            </div>
            <div className={styles.textContent}>
              <h3 className={styles.couponName}>
                Save up to {bestDeal.discountPercentage}% on {bestDeal.planName}!
              </h3>
              <p className={styles.couponDescription}>Limited time deal</p>
            </div>
          </div>
          {timeRemaining && (
            <div className={styles.timerSection}>
              <span className={styles.timerLabel}>Ends in:</span>
              <span className={styles.timerIcon}>⏰</span>
              <span className={styles.timerText}>{timeRemaining}</span>
            </div>
          )}
          <div className={styles.rightSection}>
            <div className={styles.codeContainer}>
              <span className={styles.codeLabel}>You save:</span>
              <button
                className={styles.codeButton}
                onClick={handleGoToPricing}
                aria-label="View pricing"
              >
                <span className={styles.codeValue}>{bestDeal.formattedSavings}</span>
                <span className={styles.copyIcon}>🔥</span>
              </button>
            </div>
            <button
              type="button"
              className={styles.ctaButton}
              onClick={handleGoToPricing}
            >
              Claim Offer
            </button>
          </div>
        </div>
        <div className={styles.shimmer}></div>
      </div>
    </div>
  );
};

HighlightedCoupon.displayName = 'HighlightedCoupon';
