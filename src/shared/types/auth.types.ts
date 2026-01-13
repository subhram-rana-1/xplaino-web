/**
 * Authentication-related TypeScript types
 * 
 * Matches the API models from the Caten backend
 */

export type AuthVendor = 'GOOGLE';

export interface UserInfo {
  id: string;
  name: string;
  firstName?: string | null;
  lastName?: string | null;
  email: string;
  picture?: string | null;
  role?: 'ADMIN' | 'SUPER_ADMIN' | null;
}

export interface LoginRequest {
  authVendor: AuthVendor;
  idToken: string;
}

export interface LoginResponse {
  isLoggedIn: boolean;
  accessToken: string;
  accessTokenExpiresAt: number;
  refreshToken: string;
  refreshTokenExpiresAt: number;
  userSessionPk: string;
  user: UserInfo;
}

export interface LogoutRequest {
  authVendor: AuthVendor;
}

export interface LogoutResponse {
  isLoggedIn: boolean;
  accessToken: string;
  accessTokenExpiresAt: number;
  userSessionPk: string;
  user: UserInfo;
}

/**
 * Refresh token request
 */
export interface RefreshTokenRequest {
  refreshToken: string;
}

/**
 * Refresh token response (identical to LoginResponse)
 */
export interface RefreshTokenResponse extends LoginResponse {}

/**
 * Error response from API
 */
export interface ApiErrorDetail {
  errorCode?: string;
  reason?: string;
  error_message?: string;
}

export interface ApiErrorResponse {
  detail: string | ApiErrorDetail;
}

/**
 * Auth state stored in chrome.storage.local
 */
export interface AuthState extends LoginResponse {}

