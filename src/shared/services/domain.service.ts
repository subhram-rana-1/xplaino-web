/**
 * Domain service
 * 
 * Handles API calls for domain operations
 */

import { authConfig } from '@/config/auth.config';
import { fetchWithAuth } from './api-client';
import type { GetAllDomainsResponse, DomainResponse, CreateDomainRequest, UpdateDomainRequest } from '@/shared/types/domain.types';

/**
 * Get all domains
 * Requires authentication and ADMIN or SUPER_ADMIN role
 */
export async function getAllDomains(
  _accessToken: string,
  offset: number = 0,
  limit: number = 20
): Promise<GetAllDomainsResponse> {
  const response = await fetchWithAuth(
    `${authConfig.catenBaseUrl}/api/domain/?offset=${offset}&limit=${limit}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Failed to fetch domains' }));
    throw new Error(errorData.detail?.error_message || errorData.detail || `Failed to fetch domains with status ${response.status}`);
  }

  const data: GetAllDomainsResponse = await response.json();
  return data;
}

/**
 * Get a domain by ID
 * Requires authentication and ADMIN or SUPER_ADMIN role
 */
export async function getDomainById(
  _accessToken: string,
  domainId: string
): Promise<DomainResponse> {
  const response = await fetchWithAuth(
    `${authConfig.catenBaseUrl}/api/domain/${domainId}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Failed to fetch domain' }));
    throw new Error(errorData.detail?.error_message || errorData.detail || `Failed to fetch domain with status ${response.status}`);
  }

  const data: DomainResponse = await response.json();
  return data;
}

/**
 * Create a new domain
 * Requires authentication and ADMIN or SUPER_ADMIN role
 */
export async function createDomain(
  _accessToken: string,
  body: CreateDomainRequest
): Promise<DomainResponse> {
  const response = await fetchWithAuth(
    `${authConfig.catenBaseUrl}/api/domain/`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Failed to create domain' }));
    throw new Error(errorData.detail?.error_message || errorData.detail || `Failed to create domain with status ${response.status}`);
  }

  const data: DomainResponse = await response.json();
  return data;
}

/**
 * Update a domain
 * Requires authentication and ADMIN or SUPER_ADMIN role
 */
export async function updateDomain(
  _accessToken: string,
  domainId: string,
  body: UpdateDomainRequest
): Promise<DomainResponse> {
  const response = await fetchWithAuth(
    `${authConfig.catenBaseUrl}/api/domain/${domainId}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Failed to update domain' }));
    throw new Error(errorData.detail?.error_message || errorData.detail || `Failed to update domain with status ${response.status}`);
  }

  const data: DomainResponse = await response.json();
  return data;
}

/**
 * Delete a domain
 * Requires authentication and ADMIN or SUPER_ADMIN role
 */
export async function deleteDomain(
  _accessToken: string,
  domainId: string
): Promise<void> {
  const response = await fetchWithAuth(
    `${authConfig.catenBaseUrl}/api/domain/${domainId}`,
    {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Failed to delete domain' }));
    throw new Error(errorData.detail?.error_message || errorData.detail || `Failed to delete domain with status ${response.status}`);
  }
}

