/**
 * Authentication service
 * 
 * Handles API calls for login/logout and chrome.storage.local operations
 */

import { authConfig } from '@/config/auth.config';
import type { 
  LoginRequest, 
  LoginResponse, 
  LogoutRequest, 
  LogoutResponse,
  AuthState 
} from '@/shared/types/auth.types';

const STORAGE_KEY = 'xplaino_web_userAuthInfo';

/**
 * Chrome storage API wrapper
 * Falls back to localStorage if chrome.storage is not available (for development)
 */
const storage = {
  async get(key: string): Promise<any> {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      return new Promise((resolve) => {
        chrome.storage.local.get([key], (result) => {
          resolve(result[key]);
        });
      });
    } else {
      // Fallback to localStorage for development
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    }
  },

  async set(key: string, value: any): Promise<void> {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      return new Promise((resolve) => {
        chrome.storage.local.set({ [key]: value }, () => {
          resolve();
        });
      });
    } else {
      // Fallback to localStorage for development
      localStorage.setItem(key, JSON.stringify(value));
      return Promise.resolve();
    }
  },

  async remove(key: string): Promise<void> {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      return new Promise((resolve) => {
        chrome.storage.local.remove([key], () => {
          resolve();
        });
      });
    } else {
      // Fallback to localStorage for development
      localStorage.removeItem(key);
      return Promise.resolve();
    }
  },
};

/**
 * Login with Google OAuth ID token
 */
export async function loginWithGoogle(idToken: string): Promise<LoginResponse> {
  const requestBody: LoginRequest = {
    authVendor: 'GOOGLE',
    idToken,
  };

  const response = await fetch(`${authConfig.catenBaseUrl}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Source': 'XPLAINO_WEB',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Login failed' }));
    throw new Error(errorData.detail || `Login failed with status ${response.status}`);
  }

  const loginResponse: LoginResponse = await response.json();
  return loginResponse;
}

/**
 * Logout user
 */
export async function logout(accessToken: string): Promise<LogoutResponse> {
  const requestBody: LogoutRequest = {
    authVendor: 'GOOGLE',
  };

  const response = await fetch(`${authConfig.catenBaseUrl}/api/auth/logout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Logout failed' }));
    throw new Error(errorData.detail || `Logout failed with status ${response.status}`);
  }

  const logoutResponse: LogoutResponse = await response.json();
  return logoutResponse;
}

/**
 * Save authentication data to chrome.storage.local
 */
export async function saveAuthToStorage(authData: LoginResponse): Promise<void> {
  await storage.set(STORAGE_KEY, authData);
  
  // Dispatch custom event for same-tab updates (localStorage storage event only fires for other tabs)
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('authStateChanged', { detail: authData }));
  }
}

/**
 * Get authentication data from chrome.storage.local
 */
export async function getAuthFromStorage(): Promise<AuthState | null> {
  const data = await storage.get(STORAGE_KEY);
  return data || null;
}

/**
 * Clear authentication data from chrome.storage.local
 */
export async function clearAuthFromStorage(): Promise<void> {
  await storage.remove(STORAGE_KEY);
  
  // Dispatch custom event for same-tab updates
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('authStateChanged', { detail: null }));
  }
}

