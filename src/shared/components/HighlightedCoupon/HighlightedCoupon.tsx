import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './HighlightedCoupon.module.css';
import { getActiveHighlightedCoupon } from '@/shared/services/coupon.service';
import type { GetActiveHighlightedCouponResponse } from '@/shared/types/coupon.types';

interface HighlightedCouponProps {
  onDismiss?: () => void;
}

/**
 * HighlightedCoupon - Displays active highlighted coupon banner above navbar in header
 * 
 * @returns JSX element or null if no active coupon
 */
export const HighlightedCoupon: React.FC<HighlightedCouponProps> = ({ onDismiss: _onDismiss }) => {
  const [coupon, setCoupon] = useState<GetActiveHighlightedCouponResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const navigate = useNavigate();

  // Countdown timer effect
  useEffect(() => {
    if (!coupon?.expiry) return;
    
    const updateCountdown = () => {
      const now = new Date().getTime();
      const expiryTime = new Date(coupon.expiry!).getTime();
      const diff = expiryTime - now;
      
      if (diff <= 0) {
        setTimeRemaining('Expired');
        return;
      }
      
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      // Format - always show seconds for urgency
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
  }, [coupon?.expiry]);

  useEffect(() => {
    const fetchCoupon = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await getActiveHighlightedCoupon();
        
        // Only set coupon if it's not the "NO_ACTIVE_HIGHLIGHTED_COUPON" response
        if (data.code !== 'NO_ACTIVE_HIGHLIGHTED_COUPON' && data.coupon_code) {
          setCoupon(data);
        } else {
          setCoupon(null);
        }
      } catch (err) {
        console.error('Error fetching highlighted coupon:', err);
        setError(err instanceof Error ? err.message : 'Failed to load coupon');
        setCoupon(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCoupon();
  }, []);

  const handleCopyCode = async () => {
    if (!coupon?.coupon_code) return;

    try {
      await navigator.clipboard.writeText(coupon.coupon_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy coupon code:', err);
    }
  };

  const handleGoToPricing = () => {
    navigate('/pricing');
  };

  // Don't render anything if loading, error, or no coupon
  if (isLoading || error || !coupon || !coupon.coupon_code) {
    return null;
  }

  return (
    <div className={styles.banner}>
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.leftSection}>
            <div className={styles.discountBadge}>
              <span className={styles.discountValue}>{coupon.discount}%</span>
              <span className={styles.discountOff}>OFF</span>
            </div>
            <div className={styles.textContent}>
              <h3 className={styles.couponName}>{coupon.name}</h3>
              {coupon.description && (
                <p className={styles.couponDescription}>{coupon.description}</p>
              )}
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
              <span className={styles.codeLabel}>Use Coupon:</span>
              <button 
                className={styles.codeButton}
                onClick={handleCopyCode}
                aria-label="Copy coupon code"
              >
                <span className={styles.codeValue}>{coupon.coupon_code}</span>
                <span className={styles.copyIcon}>
                  {copied ? '✓' : '📋'}
                </span>
              </button>
              {copied && <span className={styles.copiedText}>Copied!</span>}
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

