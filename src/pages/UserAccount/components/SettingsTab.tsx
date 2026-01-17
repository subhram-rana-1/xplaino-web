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
  const { theme: globalTheme, setTheme: setGlobalTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  // Form state
  const [nativeLanguage, setNativeLanguage] = useState<NativeLanguage | null>(null);
  const [pageTranslationView, setPageTranslationView] = useState<PageTranslationView>(PageTranslationView.REPLACE);
  const [theme, setTheme] = useState<Theme>(Theme.LIGHT);
  
  // Original values to detect changes
  const [originalSettings, setOriginalSettings] = useState<{
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

  // Check if form has changes
  const hasChanges = originalSettings && (
    nativeLanguage !== originalSettings.nativeLanguage ||
    pageTranslationView !== originalSettings.pageTranslationView ||
    theme !== originalSettings.theme
  );

  const handleUpdate = async () => {
    if (!accessToken || !hasChanges) return;

    try {
      setUpdating(true);

      await updateUserSettings(accessToken, {
        nativeLanguage,
        pageTranslationView,
        theme,
      });

      // Apply theme change after successful update
      setGlobalTheme(theme);

      // Update original settings after successful update
      setOriginalSettings({
        nativeLanguage,
        pageTranslationView,
        theme,
      });

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
        <form className={styles.form} onSubmit={(e) => { e.preventDefault(); handleUpdate(); }}>
          {/* Native Language */}
          <div className={styles.fieldGroup}>
            <div className={styles.fieldRow}>
              <label htmlFor="nativeLanguage" className={styles.label}>
                Native Language
              </label>
              <LanguageDropdown
                options={languageDropdownOptions}
                value={nativeLanguage || ''}
                onChange={(value) => setNativeLanguage(value ? (value as NativeLanguage) : null)}
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
                onTabChange={(tabId) => setPageTranslationView(tabId as PageTranslationView)}
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
                onTabChange={(tabId) => {
                  const newTheme = tabId as Theme;
                  setTheme(newTheme);
                  // Theme will be applied when Update Settings button is clicked
                }}
                iconSize={16}
                tabSize={32}
              />
            </div>
          </div>

          {/* Update Button */}
          <button
            type="submit"
            className={styles.updateButton}
            disabled={!hasChanges || updating}
          >
            {updating ? 'Updating...' : 'Update Settings'}
          </button>
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

