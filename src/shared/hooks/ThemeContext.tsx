import { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';
import { useAuth } from './useAuth';
import { getUserSettings } from '@/shared/services/user-settings.service';
import { Theme } from '@/shared/types/user-settings.types';

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

/**
 * ThemeProvider - Manages global theme state and applies it to the document
 * 
 * Features:
 * - Syncs with user settings from backend (for logged-in users)
 * - Falls back to light theme for non-logged-in users
 * - Applies theme via data-theme attribute on document.documentElement
 * - Persists theme in localStorage for immediate application on page load
 */
export function ThemeProvider({ children }: ThemeProviderProps): JSX.Element {
  const { accessToken, user } = useAuth();
  const [theme, setThemeState] = useState<Theme>(Theme.LIGHT);
  const [isLoading, setIsLoading] = useState(true);

  // Load theme from localStorage on mount (for immediate application)
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as Theme | null;
    if (savedTheme && (savedTheme === Theme.LIGHT || savedTheme === Theme.DARK)) {
      setThemeState(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme.toLowerCase());
    }
    setIsLoading(false);
  }, []);

  // Fetch theme from user settings when logged in
  useEffect(() => {
    const fetchUserTheme = async () => {
      if (!accessToken || !user) {
        // Non-logged-in users default to light theme
        setThemeState(Theme.LIGHT);
        document.documentElement.setAttribute('data-theme', 'light');
        localStorage.setItem('theme', Theme.LIGHT);
        return;
      }

      try {
        const response = await getUserSettings(accessToken);
        const userTheme = response?.settings?.theme || Theme.LIGHT;
        setThemeState(userTheme);
        document.documentElement.setAttribute('data-theme', userTheme.toLowerCase());
        localStorage.setItem('theme', userTheme);
      } catch (error) {
        console.error('Error fetching user theme:', error);
        // Fallback to light theme on error
        setThemeState(Theme.LIGHT);
        document.documentElement.setAttribute('data-theme', 'light');
      }
    };

    fetchUserTheme();
  }, [accessToken, user]);

  // Apply theme to document whenever it changes
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme.toLowerCase());
    localStorage.setItem('theme', theme);
  }, [theme]);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
  }, []);

  const value = useMemo(
    () => ({ theme, setTheme, isLoading }),
    [theme, setTheme, isLoading]
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * useTheme - Hook to access theme context
 * 
 * @returns Theme context value with current theme and setter
 * @throws Error if used outside ThemeProvider
 */
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
