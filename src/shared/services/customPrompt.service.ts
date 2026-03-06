import { authConfig } from '@/config/auth.config';
import { fetchWithAuth } from './api-client';
import type {
  CustomPromptResponse,
  GetAllCustomPromptsResponse,
  CreateCustomPromptRequest,
  UpdateCustomPromptRequest,
  CustomPromptShareResponse,
  GetSharedCustomPromptsResponse,
  ShareCustomPromptRequest,
} from '@/shared/types/customPrompt.types';

const BASE_URL = `${authConfig.catenBaseUrl}/api/custom-user-prompts`;

function getErrorMessage(errorData: unknown, fallback: string): string {
  if (errorData && typeof errorData === 'object' && 'detail' in errorData) {
    const detail = (errorData as { detail?: unknown }).detail;
    if (detail && typeof detail === 'object' && 'error_message' in detail) {
      return (detail as { error_message: string }).error_message;
    }
    if (typeof detail === 'string') return detail;
  }
  return fallback;
}

export async function createCustomPrompt(
  body: CreateCustomPromptRequest
): Promise<CustomPromptResponse> {
  const response = await fetchWithAuth(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(getErrorMessage(errorData, 'Failed to create prompt'));
  }

  return response.json();
}

export async function listCustomPrompts(
  offset = 0,
  limit = 20
): Promise<GetAllCustomPromptsResponse> {
  const url = `${BASE_URL}?offset=${offset}&limit=${limit}`;
  const response = await fetchWithAuth(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(getErrorMessage(errorData, 'Failed to fetch prompts'));
  }

  return response.json();
}

export async function getCustomPromptById(promptId: string): Promise<CustomPromptResponse> {
  const response = await fetchWithAuth(`${BASE_URL}/${promptId}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(getErrorMessage(errorData, 'Failed to fetch prompt'));
  }

  return response.json();
}

export async function updateCustomPrompt(
  promptId: string,
  body: UpdateCustomPromptRequest
): Promise<CustomPromptResponse> {
  const response = await fetchWithAuth(`${BASE_URL}/${promptId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(getErrorMessage(errorData, 'Failed to update prompt'));
  }

  return response.json();
}

export async function setCustomPromptHidden(
  promptId: string,
  isHidden: boolean
): Promise<CustomPromptResponse> {
  const response = await fetchWithAuth(
    `${BASE_URL}/${promptId}/hide?is_hidden=${isHidden}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(getErrorMessage(errorData, 'Failed to update prompt visibility'));
  }

  return response.json();
}

export async function deleteCustomPrompt(promptId: string): Promise<void> {
  const response = await fetchWithAuth(`${BASE_URL}/${promptId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(getErrorMessage(errorData, 'Failed to delete prompt'));
  }
}

export async function shareCustomPrompt(
  promptId: string,
  body: ShareCustomPromptRequest
): Promise<CustomPromptShareResponse> {
  const response = await fetchWithAuth(`${BASE_URL}/${promptId}/shares`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(getErrorMessage(errorData, 'Failed to share prompt'));
  }

  return response.json();
}

export async function listReceivedShares(
  offset = 0,
  limit = 20
): Promise<GetSharedCustomPromptsResponse> {
  const url = `${BASE_URL}/shares/received?offset=${offset}&limit=${limit}`;
  const response = await fetchWithAuth(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(getErrorMessage(errorData, 'Failed to fetch received shares'));
  }

  return response.json();
}

export async function deleteReceivedShare(shareId: string): Promise<void> {
  const response = await fetchWithAuth(`${BASE_URL}/shares/${shareId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(getErrorMessage(errorData, 'Failed to remove share'));
  }
}

export async function setReceivedShareHidden(
  shareId: string,
  isHidden: boolean
): Promise<CustomPromptShareResponse> {
  const response = await fetchWithAuth(
    `${BASE_URL}/shares/${shareId}/hide?is_hidden=${isHidden}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(getErrorMessage(errorData, 'Failed to update share visibility'));
  }

  return response.json();
}
