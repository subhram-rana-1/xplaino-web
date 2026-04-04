import React from 'react';
import { Admin } from '../Admin';
import { AdminExtensionUninstallFeedback } from '../components/AdminExtensionUninstallFeedback';
import { useAuth } from '@/shared/hooks/useAuth';
import { usePageTitle } from '@/shared/hooks/usePageTitle';

/**
 * AdminExtensionUninstallFeedbackPage - Admin extension uninstall feedback management page
 *
 * @returns JSX element
 */
export const AdminExtensionUninstallFeedbackPage: React.FC = () => {
  usePageTitle('Uninstall Feedback – Xplaino Admin');
  const { accessToken } = useAuth();

  return (
    <Admin>
      <AdminExtensionUninstallFeedback accessToken={accessToken} />
    </Admin>
  );
};

AdminExtensionUninstallFeedbackPage.displayName = 'AdminExtensionUninstallFeedbackPage';
