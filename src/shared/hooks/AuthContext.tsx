import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { useNavigate } from 'react-router-dom';
import type { AuthState, UserInfo } from '@/shared/types/auth.types';
import {
  loginWithGoogle,
  logout as logoutApi,
  saveAuthToStorage,
  getAuthFromStorage,
  clearAuthFromStorage,
} from '@/shared/services/auth.service';

interface AuthContextValue {
  isLoggedIn: boolean;
  user: UserInfo | null;
  accessToken: string | null;
  isLoading: boolean;
  login: (idToken: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Load auth state from storage on mount
  useEffect(() => {
    const loadAuthState = async () => {
      try {
        const storedAuth = await getAuthFromStorage();
        if (storedAuth) {
          const now = Math.floor(Date.now() / 1000);
          
          // Check if refresh token is still valid
          // Access token expiration is handled by the API interceptor
          if (storedAuth.refreshTokenExpiresAt > now) {
            setAuthState(storedAuth);
          } else {
            // Refresh token expired - clear auth and require re-login
            await clearAuthFromStorage();
          }
        }
      } catch (error) {
        console.error('Error loading auth state:', error);
        await clearAuthFromStorage();
      } finally {
        setIsLoading(false);
      }
    };

    loadAuthState();
  }, []);

  // Listen for auth updates (e.g., token refresh by interceptor)
  useEffect(() => {
    const handleStorageChange = async () => {
      const storedAuth = await getAuthFromStorage();
      if (storedAuth) {
        const now = Math.floor(Date.now() / 1000);
        if (storedAuth.refreshTokenExpiresAt > now) {
          setAuthState(storedAuth);
        } else {
          setAuthState(null);
        }
      } else {
        setAuthState(null);
      }
    };

    const handleAuthStateChanged = (event: Event) => {
      const customEvent = event as CustomEvent;
      const authData = customEvent.detail as AuthState | null;
      
      if (authData) {
        const now = Math.floor(Date.now() / 1000);
        if (authData.refreshTokenExpiresAt > now) {
          setAuthState(authData);
        } else {
          setAuthState(null);
        }
      } else {
        setAuthState(null);
      }
    };

    // Listen for custom auth state changes (same tab, immediate updates)
    window.addEventListener('authStateChanged', handleAuthStateChanged);
    
    // Listen for storage events (works across tabs for localStorage)
    window.addEventListener('storage', handleStorageChange);
    
    // For chrome.storage changes
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
      chrome.storage.onChanged.addListener(handleStorageChange);
    }

    return () => {
      window.removeEventListener('authStateChanged', handleAuthStateChanged);
      window.removeEventListener('storage', handleStorageChange);
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
        chrome.storage.onChanged.removeListener(handleStorageChange);
      }
    };
  }, []);

  const login = useCallback(
    async (idToken: string) => {
      try {
        setIsLoading(true);
        const loginResponse = await loginWithGoogle(idToken);
        await saveAuthToStorage(loginResponse);
        setAuthState(loginResponse);
        navigate('/');
      } catch (error) {
        console.error('Login error:', error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [navigate],
  );

  const logout = useCallback(async () => {
    try {
      setIsLoading(true);
      if (authState?.accessToken) {
        try {
          await logoutApi(authState.accessToken);
        } catch (error) {
          console.error('Logout API error:', error);
        }
      }
      await clearAuthFromStorage();
      setAuthState(null);
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
      await clearAuthFromStorage();
      setAuthState(null);
    } finally {
      setIsLoading(false);
    }
  }, [authState?.accessToken, navigate]);

  const isLoggedIn = !!authState;

  const value: AuthContextValue = {
    isLoggedIn,
    user: authState?.user || null,
    accessToken: authState?.accessToken || null,
    isLoading,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuthContext(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}


