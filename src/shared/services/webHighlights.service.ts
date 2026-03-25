import { authConfig } from '@/config/auth.config';
import { fetchWithAuth, extractErrorMessage, ApiError } from './api-client';
import type {
  PaginatedHighlightedPagesResponse,
  GetWebHighlightsResponse,
} from '@/shared/types/webHighlights.types';

/**
 * Fetch paginated list of pages on which the authenticated user has highlights.
 */
export async function getHighlightedPages(
  limit: number = 10,
  offset: number = 0
): Promise<PaginatedHighlightedPagesResponse> {
  const response = await fetchWithAuth(
    `${authConfig.catenBaseUrl}/api/web-highlights/pages?limit=${limit}&offset=${offset}`,
    {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(
      extractErrorMessage(errorData, 'Failed to fetch highlighted pages'),
      errorData?.detail?.errorCode
    );
  }

  return response.json() as Promise<PaginatedHighlightedPagesResponse>;
}

/**
 * Fetch all highlights created by the authenticated user on a specific page URL.
 */
export async function getWebHighlightsByUrl(
  pageUrl: string
): Promise<GetWebHighlightsResponse> {
  const response = await fetchWithAuth(
    `${authConfig.catenBaseUrl}/api/web-highlights?url=${encodeURIComponent(pageUrl)}`,
    {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(
      extractErrorMessage(errorData, 'Failed to fetch web highlights'),
      errorData?.detail?.errorCode
    );
  }

  return response.json() as Promise<GetWebHighlightsResponse>;
}
