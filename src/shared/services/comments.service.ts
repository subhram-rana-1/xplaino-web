/**
 * Comments service
 * 
 * Handles API calls for comments operations
 */

import { authConfig } from '@/config/auth.config';
import { fetchWithAuth } from './api-client';
import type {
  GetCommentsResponse,
  CreateCommentRequest,
  CreateCommentResponse,
  EntityType,
} from '@/shared/types/comments.types';

/**
 * Get comments for an entity
 */
export async function getCommentsByEntity(
  accessToken: string,
  entityType: EntityType,
  entityId: string,
  count: number = 20
): Promise<GetCommentsResponse> {
  const params = new URLSearchParams({
    entity_type: entityType,
    entity_id: entityId,
    count: count.toString(),
  });

  const response = await fetchWithAuth(
    `${authConfig.catenBaseUrl}/api/comment/?${params.toString()}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Failed to fetch comments' }));
    throw new Error(errorData.detail?.error_message || errorData.detail || `Failed to fetch comments with status ${response.status}`);
  }

  const data: GetCommentsResponse = await response.json();
  return data;
}

/**
 * Create a new comment
 */
export async function createComment(
  accessToken: string,
  body: CreateCommentRequest
): Promise<CreateCommentResponse> {
  const response = await fetchWithAuth(
    `${authConfig.catenBaseUrl}/api/comment/`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Failed to create comment' }));
    throw new Error(errorData.detail?.error_message || errorData.detail || `Failed to create comment with status ${response.status}`);
  }

  const data: CreateCommentResponse = await response.json();
  return data;
}

