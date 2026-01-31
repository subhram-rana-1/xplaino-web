/**
 * Paddle Service
 * 
 * Service for initializing Paddle.js and managing checkout operations.
 * Uses the @paddle/paddle-js package for type-safe Paddle integration.
 */

import { initializePaddle, Paddle } from '@paddle/paddle-js';
import { paddleConfig } from '@/shared/config/paddle.config';
import type { 
  PaddlePrice, 
  FormattedPaddlePrice,
  PaddleCheckoutItem,
  PaddleCheckoutSettings,
  PaddleCheckoutCustomer 
} from '@/shared/types/paddle.types';

// Singleton Paddle instance
let paddleInstance: Paddle | null = null;

/**
 * Get currency symbol for a given currency code
 */
const getCurrencySymbol = (currencyCode: string): string => {
  const symbols: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    JPY: '¥',
    CAD: 'C$',
    AUD: 'A$',
  };
  return symbols[currencyCode] || currencyCode;
};

/**
 * Format billing cycle for display
 */
const formatBillingCycle = (interval: string, frequency: number): string => {
  if (frequency === 1) {
    return `per ${interval}`;
  }
  return `every ${frequency} ${interval}s`;
};

/**
 * Initialize Paddle.js
 * Should be called once when the app starts or when needed
 */
export const initPaddle = async (): Promise<Paddle | null> => {
  if (paddleInstance) {
    return paddleInstance;
  }

  if (!paddleConfig.clientToken) {
    console.warn('Paddle client token not configured');
    return null;
  }

  try {
    const paddle = await initializePaddle({
      token: paddleConfig.clientToken,
      environment: paddleConfig.environment,
    });

    if (paddle) {
      paddleInstance = paddle;
      console.log(`Paddle initialized in ${paddleConfig.environment} mode`);
    }

    return paddle || null;
  } catch (error) {
    console.error('Failed to initialize Paddle:', error);
    return null;
  }
};

/**
 * Get the Paddle instance (initializes if needed)
 */
export const getPaddle = async (): Promise<Paddle | null> => {
  if (!paddleInstance) {
    return initPaddle();
  }
  return paddleInstance;
};

/**
 * Format a Paddle price for UI display
 */
export const formatPaddlePrice = (price: PaddlePrice): FormattedPaddlePrice => {
  const amount = parseInt(price.unitPrice.amount, 10) / 100;
  const currencyCode = price.unitPrice.currencyCode;
  const currencySymbol = getCurrencySymbol(currencyCode);
  const billingInterval = price.billingCycle?.interval || 'month';
  const billingFrequency = price.billingCycle?.frequency || 1;

  return {
    id: price.id,
    name: price.name || price.product?.name || 'Unnamed Plan',
    description: price.description || price.product?.description || '',
    amount,
    currencyCode,
    currencySymbol,
    billingInterval,
    billingFrequency,
    formattedPrice: `${currencySymbol}${amount.toFixed(2)}`,
    formattedBillingCycle: formatBillingCycle(billingInterval, billingFrequency),
    product: price.product ? {
      id: price.product.id,
      name: price.product.name,
      description: price.product.description || '',
      imageUrl: price.product.imageUrl,
    } : null,
  };
};

/**
 * Open Paddle checkout overlay
 */
export const openCheckout = async (
  items: PaddleCheckoutItem[],
  settings?: PaddleCheckoutSettings,
  customer?: PaddleCheckoutCustomer,
  discountId?: string
): Promise<void> => {
  const paddle = await getPaddle();
  
  if (!paddle) {
    console.error('Paddle not initialized');
    throw new Error('Payment system is not available. Please try again later.');
  }

  try {
    paddle.Checkout.open({
      items,
      ...(discountId && { discountId }),
      settings: {
        displayMode: settings?.displayMode || 'overlay',
        variant: 'one-page',
        theme: settings?.theme || 'light',
        locale: settings?.locale,
        allowLogout: settings?.allowLogout ?? true,
        showAddDiscounts: settings?.showAddDiscounts ?? true,
        showAddTaxId: settings?.showAddTaxId ?? true,
        successUrl: settings?.successUrl || `${window.location.origin}/payment-success`,
      },
      customer: customer ? {
        email: customer.email,
        address: customer.address,
      } : undefined,
    });
  } catch (error) {
    console.error('Failed to open checkout:', error);
    throw new Error('Failed to open checkout. Please try again.');
  }
};

/**
 * Open checkout for a single price
 */
export const openCheckoutForPrice = async (
  priceId: string,
  quantity: number = 1,
  settings?: PaddleCheckoutSettings,
  customer?: PaddleCheckoutCustomer,
  discountId?: string
): Promise<void> => {
  return openCheckout(
    [{ priceId, quantity }],
    settings,
    customer,
    discountId
  );
};
