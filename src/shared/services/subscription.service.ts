/**
 * Subscription Service
 * 
 * Service for fetching user subscription status and managing subscriptions
 * Matches backend API contract at /api/subscription/{user_id}
 */

import { authConfig } from '@/config/auth.config';
import { fetchWithAuth } from './api-client';
import type { GetUserSubscriptionResponse } from '@/shared/types/subscription.types';

/**
 * Get user subscription status
 * Fetches the current subscription status for the authenticated user
 * 
 * @param userId - The user's ID (UUID)
 * @returns Promise with subscription status response
 */
export async function getUserSubscriptionStatus(userId: string): Promise<GetUserSubscriptionResponse> {
  const response = await fetchWithAuth(
    `${authConfig.catenBaseUrl}/api/subscription/${userId}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Failed to fetch subscription status' }));
    throw new Error(
      errorData.detail?.error_message || 
      errorData.detail || 
      `Failed to fetch subscription status with status ${response.status}`
    );
  }

  const data: GetUserSubscriptionResponse = await response.json();
  return data;
}

/**
 * Cancel subscription
 * Initiates subscription cancellation at end of billing period
 * 
 * @param subscriptionId - The Paddle subscription ID
 * @param effectiveFrom - When cancellation takes effect ('immediately' or 'next_billing_period')
 */
export async function cancelSubscription(
  subscriptionId: string,
  effectiveFrom: 'immediately' | 'next_billing_period' = 'next_billing_period'
): Promise<void> {
  const response = await fetchWithAuth(
    `${authConfig.catenBaseUrl}/api/subscription/${subscriptionId}/cancel`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ effective_from: effectiveFrom }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Failed to cancel subscription' }));
    throw new Error(
      errorData.detail?.error_message || 
      errorData.detail || 
      `Failed to cancel subscription with status ${response.status}`
    );
  }
}

/**
 * Pause subscription
 * Pauses a subscription at end of billing period
 * 
 * @param subscriptionId - The Paddle subscription ID
 * @param effectiveFrom - When pause takes effect ('immediately' or 'next_billing_period')
 * @param resumeAt - Optional ISO datetime to automatically resume
 */
export async function pauseSubscription(
  subscriptionId: string,
  effectiveFrom: 'immediately' | 'next_billing_period' = 'next_billing_period',
  resumeAt?: string
): Promise<void> {
  const response = await fetchWithAuth(
    `${authConfig.catenBaseUrl}/api/subscription/${subscriptionId}/pause`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        effective_from: effectiveFrom,
        resume_at: resumeAt || null,
      }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Failed to pause subscription' }));
    throw new Error(
      errorData.detail?.error_message || 
      errorData.detail || 
      `Failed to pause subscription with status ${response.status}`
    );
  }
}

/**
 * Resume subscription
 * Resumes a paused subscription
 * 
 * @param subscriptionId - The Paddle subscription ID
 * @param effectiveFrom - When resume takes effect ('immediately' or 'next_billing_period')
 */
export async function resumeSubscription(
  subscriptionId: string,
  effectiveFrom: 'immediately' | 'next_billing_period' = 'immediately'
): Promise<void> {
  const response = await fetchWithAuth(
    `${authConfig.catenBaseUrl}/api/subscription/${subscriptionId}/resume`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ effective_from: effectiveFrom }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Failed to resume subscription' }));
    throw new Error(
      errorData.detail?.error_message || 
      errorData.detail || 
      `Failed to resume subscription with status ${response.status}`
    );
  }
}
