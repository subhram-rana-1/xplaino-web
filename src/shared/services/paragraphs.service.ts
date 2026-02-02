/**
 * Paragraphs service
 * 
 * Handles API calls for saved paragraphs operations
 */

import { authConfig } from '@/config/auth.config';
import { fetchWithAuth, extractErrorMessage } from './api-client';
import type { 
  GetAllSavedParagraphsResponse, 
  Folder,
  UserQuestionType,
  ChatMessage,
  AskAISSEResponse 
} from '@/shared/types/paragraphs.types';

/**
 * Get all saved paragraphs with folders and pagination
 */
export async function getAllSavedParagraphs(
  _accessToken: string,
  folderId: string | null = null,
  offset: number = 0,
  limit: number = 20
): Promise<GetAllSavedParagraphsResponse> {
  const folderIdParam = folderId ? `&folder_id=${folderId}` : '';
  const response = await fetchWithAuth(
    `${authConfig.catenBaseUrl}/api/saved-paragraph/?offset=${offset}&limit=${limit}${folderIdParam}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(extractErrorMessage(errorData, 'Failed to fetch saved paragraphs'));
  }

  const data: GetAllSavedParagraphsResponse = await response.json();
  return data;
}

/**
 * Delete a saved paragraph by ID
 */
export async function deleteSavedParagraph(
  _accessToken: string,
  paragraphId: string
): Promise<void> {
  const response = await fetchWithAuth(
    `${authConfig.catenBaseUrl}/api/saved-paragraph/${paragraphId}`,
    {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(extractErrorMessage(errorData, 'Failed to delete saved paragraph'));
  }
}

/**
 * Create a paragraph folder
 */
export async function createParagraphFolder(
  _accessToken: string,
  name: string,
  parentFolderId: string | null = null
): Promise<Folder> {
  const response = await fetchWithAuth(
    `${authConfig.catenBaseUrl}/api/saved-paragraph/folder`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        parent_folder_id: parentFolderId,
      }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(extractErrorMessage(errorData, 'Failed to create folder'));
  }

  const data: Folder = await response.json();
  return data;
}

/**
 * Delete a folder by ID
 */
export async function deleteFolder(
  _accessToken: string,
  folderId: string
): Promise<void> {
  const response = await fetchWithAuth(
    `${authConfig.catenBaseUrl}/api/saved-paragraph/folder/${folderId}`,
    {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(extractErrorMessage(errorData, 'Failed to delete folder'));
  }
}

/**
 * Move a saved paragraph to a folder
 * 
 * Note: The API expects targetFolderId to be a string UUID. Passing null (for root) 
 * will result in a validation error as the API requires a valid folder ID.
 */
export async function moveSavedParagraphToFolder(
  _accessToken: string,
  paragraphId: string,
  folderId: string | null
): Promise<void> {
  const response = await fetchWithAuth(
    `${authConfig.catenBaseUrl}/api/saved-paragraph/${paragraphId}/move-to-folder`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ targetFolderId: folderId }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(extractErrorMessage(errorData, 'Failed to move saved paragraph'));
  }
}

/**
 * Ask AI about saved paragraphs with streaming response via SSE
 * 
 * @param accessToken - User's access token
 * @param initialContext - Array of formatted content strings (required, min 1 item)
 * @param userQuestionType - Type of question (SHORT_SUMMARY, DESCRIPTIVE_NOTE, CUSTOM)
 * @param chatHistory - Previous chat history for context (default: empty array)
 * @param userQuestion - Custom user question (required when userQuestionType is CUSTOM)
 * @param languageCode - Optional language code (e.g., 'EN', 'FR', 'ES')
 * @param signal - AbortSignal for canceling the request
 * @returns AsyncGenerator that yields SSE response chunks
 */
export async function* askAISavedParagraphs(
  _accessToken: string,
  initialContext: string[],
  userQuestionType: UserQuestionType,
  chatHistory: ChatMessage[] = [],
  userQuestion?: string,
  languageCode?: string | null,
  signal?: AbortSignal
): AsyncGenerator<AskAISSEResponse, void, unknown> {
  // Validate initialContext
  if (!initialContext || initialContext.length === 0) {
    throw new Error('initialContext must contain at least one item');
  }

  // Validate userQuestion for CUSTOM type
  if (userQuestionType === 'CUSTOM' && (!userQuestion || userQuestion.trim().length === 0)) {
    throw new Error('userQuestion is required and must have length > 0 when userQuestionType is CUSTOM');
  }

  const response = await fetchWithAuth(
    `${authConfig.catenBaseUrl}/api/saved-paragraph/ask-ai`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        initialContext,
        chatHistory,
        userQuestionType,
        userQuestion,
        languageCode,
      }),
      signal,
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(extractErrorMessage(errorData, 'Failed to ask AI'));
  }

  if (!response.body) {
    throw new Error('Response body is null');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        break;
      }

      // Decode the chunk and add to buffer
      buffer += decoder.decode(value, { stream: true });

      // Process complete SSE messages
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep incomplete line in buffer

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6); // Remove 'data: ' prefix

          if (data === '[DONE]') {
            return;
          }

          try {
            const parsed = JSON.parse(data) as AskAISSEResponse;
            yield parsed;
          } catch (error) {
            console.error('Failed to parse SSE data:', data, error);
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

