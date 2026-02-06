import React, { useState, useEffect } from 'react';
import { FiRefreshCw, FiLayers, FiSun, FiMoon } from 'react-icons/fi';
import styles from './SettingsTab.module.css';
import { useAuth } from '@/shared/hooks/useAuth';
import { useTheme } from '@/shared/hooks/useTheme';
import { getUserSettings, updateUserSettings, getAllLanguages } from '@/shared/services/user-settings.service';
import { PageTranslationView, Theme, NativeLanguage } from '@/shared/types/user-settings.types';
import { Toast } from '@/shared/components/Toast';
import { LanguageDropdown, type LanguageDropdownOption } from './LanguageDropdown';
import { IconTabGroup } from '@/shared/components/IconTabGroup';

/**
 * SettingsTab - User settings management tab
 * 
 * @returns JSX element
 */
export const SettingsTab: React.FC = () => {
  const { accessToken } = useAuth();
  const { setTheme: setGlobalTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [, setUpdating] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  // Form state
  const [nativeLanguage, setNativeLanguage] = useState<NativeLanguage | null>(null);
  const [pageTranslationView, setPageTranslationView] = useState<PageTranslationView>(PageTranslationView.REPLACE);
  const [theme, setTheme] = useState<Theme>(Theme.LIGHT);
  
  // Original values to detect changes
  const [, setOriginalSettings] = useState<{
    nativeLanguage: NativeLanguage | null;
    pageTranslationView: PageTranslationView;
    theme: Theme;
  } | null>(null);
  
  // Languages list
  const [languageDropdownOptions, setLanguageDropdownOptions] = useState<LanguageDropdownOption[]>([]);

  // Fetch user settings and languages on mount
  useEffect(() => {
    const fetchData = async () => {
      if (!accessToken) return;

      try {
        setLoading(true);
        
        // Fetch both in parallel
        const [settingsResponse, languagesResponse] = await Promise.all([
          getUserSettings(accessToken),
          getAllLanguages(),
        ]);

        // Check if settings exist and have the expected structure
        const settings = settingsResponse?.settings;
        if (!settings) {
          throw new Error('Settings data not found');
        }

        // Safely access settings with fallback values
        const nativeLang = settings.nativeLanguage || null;
        const pageView = settings.pageTranslationView || PageTranslationView.REPLACE;
        const themeValue = settings.theme || Theme.LIGHT;

        setNativeLanguage(nativeLang);
        setPageTranslationView(pageView);
        setTheme(themeValue);
        setGlobalTheme(themeValue);
        
        // Store original values
        setOriginalSettings({
          nativeLanguage: nativeLang,
          pageTranslationView: pageView,
          theme: themeValue,
        });
        
        // Sort languages by English name and create dropdown options
        const sortedLanguages = [...languagesResponse.languages].sort((a, b) =>
          a.languageNameInEnglish.localeCompare(b.languageNameInEnglish)
        );
        
        const dropdownOptions: LanguageDropdownOption[] = [
          { value: '', label: 'None' },
          ...sortedLanguages.map((lang) => ({
            value: lang.languageCode,
            label: `${lang.languageNameInEnglish} (${lang.languageNameInNative})`,
          })),
        ];
        setLanguageDropdownOptions(dropdownOptions);
      } catch (error) {
        console.error('Error fetching settings:', error);
        setToast({ 
          message: error instanceof Error ? error.message : 'Failed to load settings', 
          type: 'error' 
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [accessToken]);

  // Auto-save settings to API
  const saveSettings = async (settings: {
    nativeLanguage: NativeLanguage | null;
    pageTranslationView: PageTranslationView;
    theme: Theme;
  }) => {
    if (!accessToken) return;

    try {
      setUpdating(true);
      await updateUserSettings(accessToken, settings);
      setOriginalSettings(settings);
      setToast({ message: 'Settings updated successfully', type: 'success' });
    } catch (error) {
      console.error('Error updating settings:', error);
      setToast({ 
        message: error instanceof Error ? error.message : 'Failed to update settings', 
        type: 'error' 
      });
    } finally {
      setUpdating(false);
    }
  };

  // Individual change handlers that auto-save
  const handleNativeLanguageChange = async (value: string | null) => {
    const newValue = value ? (value as NativeLanguage) : null;
    setNativeLanguage(newValue);
    await saveSettings({ nativeLanguage: newValue, pageTranslationView, theme });
  };

  const handlePageTranslationViewChange = async (tabId: string) => {
    const newValue = tabId as PageTranslationView;
    setPageTranslationView(newValue);
    await saveSettings({ nativeLanguage, pageTranslationView: newValue, theme });
  };

  const handleThemeChange = async (tabId: string) => {
    const newTheme = tabId as Theme;
    setTheme(newTheme);
    setGlobalTheme(newTheme); // Apply theme immediately
    await saveSettings({ nativeLanguage, pageTranslationView, theme: newTheme });
  };

  if (loading) {
    return (
      <div className={styles.settingsTab}>
        <div className={styles.loading}>Loading settings...</div>
      </div>
    );
  }

  return (
    <div className={styles.settingsTab}>
      <div className={styles.content}>
        <form className={styles.form}>
          {/* Native Language */}
          <div className={styles.fieldGroup}>
            <div className={styles.fieldRow}>
              <label htmlFor="nativeLanguage" className={styles.label}>
                Native Language
              </label>
              <LanguageDropdown
                options={languageDropdownOptions}
                value={nativeLanguage || ''}
                onChange={handleNativeLanguageChange}
                placeholder="Select language"
              />
            </div>
          </div>

          {/* Page Translation View */}
          <div className={styles.fieldGroup}>
            <div className={styles.fieldRow}>
              <label className={styles.label}>
                Page Translation View
              </label>
              <IconTabGroup
                tabs={[
                  { id: PageTranslationView.REPLACE, icon: FiRefreshCw, label: 'Replace' },
                  { id: PageTranslationView.APPEND, icon: FiLayers, label: 'Append' },
                ]}
                activeTabId={pageTranslationView}
                onTabChange={handlePageTranslationViewChange}
                iconSize={16}
                tabSize={32}
              />
            </div>
          </div>

          {/* Theme */}
          <div className={styles.fieldGroup}>
            <div className={styles.fieldRow}>
              <label className={styles.label}>
                Theme
              </label>
              <IconTabGroup
                tabs={[
                  { id: Theme.LIGHT, icon: FiSun, label: 'Light' },
                  { id: Theme.DARK, icon: FiMoon, label: 'Dark' },
                ]}
                activeTabId={theme}
                onTabChange={handleThemeChange}
                iconSize={16}
                tabSize={32}
              />
            </div>
          </div>
        </form>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

SettingsTab.displayName = 'SettingsTab';

