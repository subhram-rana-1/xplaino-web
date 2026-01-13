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
export const HighlightedCoupon: React.FC<HighlightedCouponProps> = ({ onDismiss }) => {
  const [coupon, setCoupon] = useState<GetActiveHighlightedCouponResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const navigate = useNavigate();

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

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsVisible(false);
      if (onDismiss) {
        onDismiss();
      }
    }, 300);
  };

  // Don't render anything if loading, error, no coupon, or after closing
  if (isLoading || error || !coupon || !coupon.coupon_code || !isVisible) {
    return null;
  }

  return (
    <div className={`${styles.banner} ${isClosing ? styles.closing : ''}`}>
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
          <div className={styles.rightSection}>
            <div className={styles.codeContainer}>
              <span className={styles.codeLabel}>Use Code:</span>
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
              View Pricing
            </button>
          </div>
        </div>
        <div className={styles.shimmer}></div>
      </div>
    </div>
  );
};

HighlightedCoupon.displayName = 'HighlightedCoupon';

