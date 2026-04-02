/**
 * Extension Uninstall Feedback TypeScript types
 *
 * Matches the API models from the Caten backend (/api/extension-uninstall/*)
 */

export enum ExtensionUninstallationReason {
  TOO_EXPENSIVE = 'TOO_EXPENSIVE',
  NOT_USING = 'NOT_USING',
  FOUND_ALTERNATIVE = 'FOUND_ALTERNATIVE',
  MISSING_FEATURES = 'MISSING_FEATURES',
  EXTENSION_NOT_WORKING = 'EXTENSION_NOT_WORKING',
  OTHER = 'OTHER',
}

export interface ExtensionUninstallFeedbackItem {
  id: string;
  reason: ExtensionUninstallationReason;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface GetAllExtensionUninstallFeedbacksResponse {
  feedbacks: ExtensionUninstallFeedbackItem[];
  total: number;
  offset: number;
  limit: number;
  has_next: boolean;
}

export interface GetAllExtensionUninstallFeedbacksFilters {
  reason?: string;
  created_at_from?: string;
  created_at_to?: string;
  offset?: number;
  limit?: number;
}
