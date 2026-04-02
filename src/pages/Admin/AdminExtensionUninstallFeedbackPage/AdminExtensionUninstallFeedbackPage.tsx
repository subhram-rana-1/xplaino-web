import React from 'react';
import { Admin } from '../Admin';
import { AdminExtensionUninstallFeedback } from '../components/AdminExtensionUninstallFeedback';
import { useAuth } from '@/shared/hooks/useAuth';

/**
 * AdminExtensionUninstallFeedbackPage - Admin extension uninstall feedback management page
 *
 * @returns JSX element
 */
export const AdminExtensionUninstallFeedbackPage: React.FC = () => {
  const { accessToken } = useAuth();

  return (
    <Admin>
      <AdminExtensionUninstallFeedback accessToken={accessToken} />
    </Admin>
  );
};

AdminExtensionUninstallFeedbackPage.displayName = 'AdminExtensionUninstallFeedbackPage';
