/**
 * Issues service
 * 
 * Handles API calls for issues operations
 */

import { authConfig } from '@/config/auth.config';
import type { GetMyIssuesResponse, IssueResponse, ReportIssueRequest } from '@/shared/types/issues.types';

/**
 * Get all issues for the authenticated user
 */
export async function getMyIssues(
  accessToken: string,
  statuses?: string[]
): Promise<GetMyIssuesResponse> {
  const statusesParam = statuses && statuses.length > 0 
    ? `?${statuses.map(s => `statuses=${encodeURIComponent(s)}`).join('&')}`
    : '';
  
  const response = await fetch(
    `${authConfig.catenBaseUrl}/api/issue${statusesParam}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'X-Source': 'XPLAINO_WEB',
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Failed to fetch issues' }));
    throw new Error(errorData.detail?.error_message || errorData.detail || `Failed to fetch issues with status ${response.status}`);
  }

  const data: GetMyIssuesResponse = await response.json();
  return data;
}

/**
 * Report a new issue
 */
export async function reportIssue(
  accessToken: string,
  body: ReportIssueRequest
): Promise<IssueResponse> {
  const response = await fetch(
    `${authConfig.catenBaseUrl}/api/issue/`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'X-Source': 'XPLAINO_WEB',
      },
      body: JSON.stringify(body),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Failed to report issue' }));
    throw new Error(errorData.detail?.error_message || errorData.detail || `Failed to report issue with status ${response.status}`);
  }

  const data: IssueResponse = await response.json();
  return data;
}

