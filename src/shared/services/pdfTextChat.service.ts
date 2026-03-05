import { authConfig } from '@/config/auth.config';
import { fetchWithAuth, fetchPublic } from './api-client';
import type {
  CreatePdfTextChatRequest,
  AppendPdfTextChatMessagesRequest,
  CreatePdfTextChatResponse,
  GetAllPdfTextChatsResponse,
  GetPdfTextChatHistoryResponse,
  PdfTextChatHistoryItemResponse,
} from '@/shared/types/pdfTextChat.types';

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

export async function createPdfTextChat(
  _accessToken: string,
  pdfId: string,
  body: CreatePdfTextChatRequest,
): Promise<CreatePdfTextChatResponse> {
  const response = await fetchWithAuth(
    `${authConfig.catenBaseUrl}/api/pdf/${pdfId}/text-chat`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(getErrorMessage(errorData, 'Failed to create text chat'));
  }

  return response.json();
}

export async function appendPdfTextChatMessages(
  _accessToken: string,
  pdfId: string,
  textChatId: string,
  body: AppendPdfTextChatMessagesRequest,
): Promise<PdfTextChatHistoryItemResponse[]> {
  const response = await fetchWithAuth(
    `${authConfig.catenBaseUrl}/api/pdf/${pdfId}/text-chat/${textChatId}/messages`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(getErrorMessage(errorData, 'Failed to append messages'));
  }

  return response.json();
}

export async function getAllPdfTextChats(
  _accessToken: string | null,
  pdfId: string,
): Promise<GetAllPdfTextChatsResponse> {
  const fetcher = _accessToken ? fetchWithAuth : fetchPublic;
  const response = await fetcher(
    `${authConfig.catenBaseUrl}/api/pdf/${pdfId}/text-chat`,
    {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    },
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(getErrorMessage(errorData, 'Failed to get text chats'));
  }

  return response.json();
}

export async function getPdfTextChatHistory(
  _accessToken: string | null,
  pdfId: string,
  textChatId: string,
  offset = 0,
  limit = 200,
): Promise<GetPdfTextChatHistoryResponse> {
  const fetcher = _accessToken ? fetchWithAuth : fetchPublic;
  const params = new URLSearchParams({ offset: String(offset), limit: String(limit) });
  const response = await fetcher(
    `${authConfig.catenBaseUrl}/api/pdf/${pdfId}/text-chat/${textChatId}/messages?${params}`,
    {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    },
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(getErrorMessage(errorData, 'Failed to get text chat history'));
  }

  return response.json();
}

export async function deletePdfTextChat(
  _accessToken: string,
  pdfId: string,
  textChatId: string,
): Promise<void> {
  const response = await fetchWithAuth(
    `${authConfig.catenBaseUrl}/api/pdf/${pdfId}/text-chat/${textChatId}`,
    {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    },
  );

  if (!response.ok && response.status !== 204) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(getErrorMessage(errorData, 'Failed to delete text chat'));
  }
}
