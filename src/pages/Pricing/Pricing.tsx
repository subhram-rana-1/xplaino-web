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

  useEffect(() => {
    const fetchPricings = async () => {
      try {
        setIsLoading(true);
        const response = await getLivePricings();
        setPricings(response.pricings);
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

  const formatPriceDisplay = (pricing: PricingResponse): string => {
    const period = pricing.recurring_period.toLowerCase();
    const amount = pricing.amount;
    const currency = pricing.currency;
    
    // Get currency symbol
    const currencySymbol = currency === 'USD' ? '$' : currency;
    
    if (amount === 0) {
      return `Starts at ${currencySymbol}0 per month/user`;
    }
    
    if (period === 'year') {
      // If amount is in thousands, show with 'k' suffix
      if (amount >= 1000) {
        const thousands = amount / 1000;
        return `Starts at ${currencySymbol}${thousands}k per year`;
      }
      return `Starts at ${currencySymbol}${amount.toLocaleString()} per year`;
    }
    
    return `Starts at ${currencySymbol}${amount} per month/user`;
  };

  const parseFeatures = (featuresString: string): string[] => {
    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(featuresString);
      if (Array.isArray(parsed)) {
        return parsed;
      }
      if (typeof parsed === 'object' && parsed.features) {
        return Array.isArray(parsed.features) ? parsed.features : [];
      }
    } catch {
      // If not JSON, try splitting by newlines or commas
      if (featuresString.includes('\n')) {
        return featuresString.split('\n').filter(f => f.trim());
      }
      if (featuresString.includes(',')) {
        return featuresString.split(',').map(f => f.trim()).filter(f => f);
      }
    }
    return [featuresString];
  };

  const renderMarkdown = (text: string): React.ReactNode => {
    // Simple markdown renderer for bold text (**text**) and regular text
    const parts: React.ReactNode[] = [];
    let currentIndex = 0;
    const boldRegex = /\*\*(.*?)\*\*/g;
    let match;

    while ((match = boldRegex.exec(text)) !== null) {
      // Add text before the bold
      if (match.index > currentIndex) {
        const beforeText = text.substring(currentIndex, match.index);
        if (beforeText) {
          parts.push(beforeText);
        }
      }
      
      // Add bold text
      parts.push(<strong key={match.index}>{match[1]}</strong>);
      
      currentIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (currentIndex < text.length) {
      const remainingText = text.substring(currentIndex);
      if (remainingText) {
        parts.push(remainingText);
      }
    }

    // If no bold text was found, return the original text
    if (parts.length === 0) {
      return text;
    }

    return <>{parts}</>;
  };

  const getDescription = (pricing: PricingResponse): string => {
    const name = pricing.name.toLowerCase();
    if (name.includes('individual')) {
      return 'Good for individuals who are just starting out and simply want the essentials.';
    } else if (name.includes('team')) {
      return 'Highly recommended for small teams who seek to upgrade their time & perform.';
    } else if (name.includes('enterprise')) {
      return 'Robust scheduling for larger teams looking to have more control, privacy & security.';
    }
    return 'Perfect for your needs.';
  };

  const getButtonText = (pricing: PricingResponse): string => {
    const name = pricing.name.toLowerCase();
    if (name.includes('enterprise')) {
      return 'Contact us';
    }
    return 'Get started';
  };

  const getButtonClass = (pricing: PricingResponse, index: number): string => {
    const name = pricing.name.toLowerCase();
    // Middle card (index 1) or Teams plan gets blue button
    if (index === 1 || name.includes('team')) {
      return styles.buttonPrimary;
    }
    return styles.buttonSecondary;
  };

  const hasBanner = (pricing: PricingResponse, index: number): boolean => {
    const name = pricing.name.toLowerCase();
    // Middle card or Teams plan might have a banner
    return index === 1 || name.includes('team');
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
          <p className={styles.emptyMessage}>Its free ! Download chrome extension to get started</p>
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
            const features = parseFeatures(pricing.features);
            const isMiddleCard = index === 1;
            
            return (
              <div 
                key={pricing.id} 
                className={`${styles.card} ${isMiddleCard ? styles.cardMiddle : ''}`}
              >
                {hasBanner(pricing, index) && (
                  <div className={styles.banner}>30 days free trial</div>
                )}
                <h2 className={styles.cardTitle}>{pricing.name}</h2>
                <div className={styles.price}>{formatPriceDisplay(pricing)}</div>
                <p className={styles.description}>{getDescription(pricing)}</p>
                <button className={getButtonClass(pricing, index)}>
                  {getButtonText(pricing)}
                </button>
                <div className={styles.features}>
                  {index === 1 && (
                    <p className={styles.featuresPrefix}>Free plan features, plus:</p>
                  )}
                  {index === 2 && (
                    <p className={styles.featuresPrefix}>Organization plan features, plus:</p>
                  )}
                  <ul className={styles.featuresList}>
                    {features.map((feature, idx) => (
                      <li key={idx} className={styles.featureItem}>
                        <span className={styles.checkmark}>✓</span>
                        <span className={styles.featureText}>{renderMarkdown(feature)}</span>
                      </li>
                    ))}
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

