/**
 * Issues service
 * 
 * Handles API calls for issues operations
 */

import { authConfig } from '@/config/auth.config';
import type { GetMyIssuesResponse, GetAllIssuesResponse, GetAllIssuesFilters, IssueResponse, ReportIssueRequest, UpdateIssueRequest, GetIssueByTicketIdResponse } from '@/shared/types/issues.types';

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
  body: ReportIssueRequest,
  files?: File[]
): Promise<IssueResponse> {
  // Create FormData for multipart/form-data request
  const formData = new FormData();
  
  // Append form fields
  formData.append('type', body.type);
  if (body.heading !== null && body.heading !== undefined) {
    formData.append('heading', body.heading);
  }
  formData.append('description', body.description);
  if (body.webpage_url !== null && body.webpage_url !== undefined) {
    formData.append('webpage_url', body.webpage_url);
  }
  
  // Append files if provided
  if (files && files.length > 0) {
    files.forEach((file) => {
      formData.append('files', file);
    });
  }

  const response = await fetch(
    `${authConfig.catenBaseUrl}/api/issue/`,
    {
      method: 'POST',
      headers: {
        // Don't set Content-Type header - let browser set it with boundary for multipart/form-data
        'Authorization': `Bearer ${accessToken}`,
        'X-Source': 'XPLAINO_WEB',
      },
      body: formData,
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Failed to report issue' }));
    throw new Error(errorData.detail?.error_message || errorData.detail || `Failed to report issue with status ${response.status}`);
  }

  const data: IssueResponse = await response.json();
  return data;
}

/**
 * Get issue by ticket ID
 * Returns issue with CreatedByUser objects for created_by and closed_by
 */
export async function getIssueByTicketId(
  accessToken: string,
  ticketId: string
): Promise<GetIssueByTicketIdResponse> {
  const response = await fetch(
    `${authConfig.catenBaseUrl}/api/issue/ticket/${ticketId}`,
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
    const errorData = await response.json().catch(() => ({ detail: 'Failed to fetch issue' }));
    throw new Error(errorData.detail?.error_message || errorData.detail || `Failed to fetch issue with status ${response.status}`);
  }

  const data: GetIssueByTicketIdResponse = await response.json();
  return data;
}

/**
 * Get all issues (Admin only)
 * Requires ADMIN or SUPER_ADMIN role
 */
export async function getAllIssues(
  accessToken: string,
  filters?: GetAllIssuesFilters
): Promise<GetAllIssuesResponse> {
  const params = new URLSearchParams();
  
  if (filters?.ticket_id) {
    params.append('ticket_id', filters.ticket_id);
  }
  if (filters?.type) {
    params.append('type', filters.type);
  }
  if (filters?.status) {
    params.append('status', filters.status);
  }
  if (filters?.closed_by) {
    params.append('closed_by', filters.closed_by);
  }
  if (filters?.offset !== undefined) {
    params.append('offset', filters.offset.toString());
  }
  if (filters?.limit !== undefined) {
    params.append('limit', filters.limit.toString());
  }
  
  const queryString = params.toString();
  const url = `${authConfig.catenBaseUrl}/api/issue/all${queryString ? `?${queryString}` : ''}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
      'X-Source': 'XPLAINO_WEB',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Failed to fetch all issues' }));
    throw new Error(errorData.detail?.error_message || errorData.detail || `Failed to fetch all issues with status ${response.status}`);
  }

  const data: GetAllIssuesResponse = await response.json();
  return data;
}

/**
 * Update an issue (Admin only)
 * Requires ADMIN or SUPER_ADMIN role
 */
export async function updateIssue(
  accessToken: string,
  issueId: string,
  body: UpdateIssueRequest
): Promise<IssueResponse> {
  const response = await fetch(
    `${authConfig.catenBaseUrl}/api/issue/${issueId}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'X-Source': 'XPLAINO_WEB',
      },
      body: JSON.stringify(body),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Failed to update issue' }));
    throw new Error(errorData.detail?.error_message || errorData.detail || `Failed to update issue with status ${response.status}`);
  }

  const data: IssueResponse = await response.json();
  return data;
}

