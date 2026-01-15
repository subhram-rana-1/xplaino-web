/**
 * API Client with automatic token refresh interceptor
 * 
 * Provides fetchWithAuth() wrapper that automatically:
 * - Adds Authorization header with access token
 * - Detects TOKEN_EXPIRED errors (401 + errorCode)
 * - Refreshes tokens automatically
 * - Retries failed requests with new token
 * - Prevents duplicate refresh calls
 */

import { authConfig } from '@/config/auth.config';
import type { 
  RefreshTokenRequest, 
  RefreshTokenResponse, 
  ApiErrorResponse,
  AuthState 
} from '@/shared/types/auth.types';
import { getAuthFromStorage, saveAuthToStorage, clearAuthFromStorage } from './auth.service';

/**
 * Global refresh promise to prevent duplicate refresh calls
 * When a refresh is in progress, subsequent requests wait for it
 */
let refreshPromise: Promise<AuthState> | null = null;

/**
 * Check if error response indicates token expiration
 */
function isTokenExpiredError(errorData: any): boolean {
  if (!errorData || !errorData.detail) {
    return false;
  }
  
  // Check if detail is an object with errorCode
  if (typeof errorData.detail === 'object' && errorData.detail.errorCode === 'TOKEN_EXPIRED') {
    return true;
  }
  
  return false;
}

/**
 * Refresh access token using refresh token
 * Returns new auth state with updated tokens
 */
async function refreshAccessToken(currentAuth: AuthState): Promise<AuthState> {
  const requestBody: RefreshTokenRequest = {
    refreshToken: currentAuth.refreshToken,
  };

  const response = await fetch(`${authConfig.catenBaseUrl}/api/auth/refresh-token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${currentAuth.accessToken}`,
      'X-Source': 'XPLAINO_WEB',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    // Refresh failed - clear auth and throw error
    await clearAuthFromStorage();
    const errorData = await response.json().catch(() => ({ detail: 'Token refresh failed' }));
    throw new Error(errorData.detail?.reason || errorData.detail || 'Token refresh failed');
  }

  const refreshResponse: RefreshTokenResponse = await response.json();
  
  // Save new auth state to storage
  await saveAuthToStorage(refreshResponse);
  
  return refreshResponse;
}

/**
 * Authenticated fetch wrapper with automatic token refresh
 * 
 * Usage:
 *   const response = await fetchWithAuth(url, { method: 'GET' });
 * 
 * Note: Do NOT include Authorization header - it's added automatically
 */
export async function fetchWithAuth(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  // Get current auth state
  const auth = await getAuthFromStorage();
  
  if (!auth || !auth.accessToken) {
    throw new Error('Not authenticated');
  }

  // Prepare headers with Authorization
  const headers = new Headers(options.headers);
  headers.set('Authorization', `Bearer ${auth.accessToken}`);
  headers.set('X-Source', 'XPLAINO_WEB');
  
  // For FormData, ensure Content-Type is NOT set so browser auto-sets it with boundary
  if (options.body instanceof FormData) {
    headers.delete('Content-Type');
  }

  // Make the request
  const requestOptions: RequestInit = {
    ...options,
    headers,
  };

  let response = await fetch(url, requestOptions);

  // Check if token expired
  if (response.status === 401) {
    const errorData: ApiErrorResponse = await response.json().catch(() => ({ detail: '' }));
    
    if (isTokenExpiredError(errorData)) {
      // Token expired - refresh it
      
      // Use global promise to prevent duplicate refreshes
      if (!refreshPromise) {
        refreshPromise = refreshAccessToken(auth)
          .finally(() => {
            // Clear the promise after completion (success or failure)
            refreshPromise = null;
          });
      }

      try {
        // Wait for refresh to complete
        const newAuth = await refreshPromise;
        
        // Retry the original request with new token
        headers.set('Authorization', `Bearer ${newAuth.accessToken}`);
        
        const retryOptions: RequestInit = {
          ...options,
          headers,
        };
        
        response = await fetch(url, retryOptions);
      } catch (refreshError) {
        // Refresh failed - propagate error
        // Auth has already been cleared in refreshAccessToken()
        throw refreshError;
      }
    } else {
      // Other 401 error (not token expired) - return as-is
      // Recreate response with error data for caller to handle
      return new Response(JSON.stringify(errorData), {
        status: 401,
        statusText: response.statusText,
        headers: response.headers,
      });
    }
  }

  return response;
}

/**
 * Fetch wrapper for unauthenticated requests
 * Adds X-Source header but no Authorization
 */
export async function fetchPublic(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const headers = new Headers(options.headers);
  headers.set('X-Source', 'XPLAINO_WEB');

  const requestOptions: RequestInit = {
    ...options,
    headers,
  };

  return fetch(url, requestOptions);
}
