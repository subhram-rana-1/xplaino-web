import { authConfig } from '@/config/auth.config';
import { fetchWithAuth, fetchPublic, ApiError, extractErrorMessage } from './api-client';
import type {
  PdfContentPreprocessResponse,
  PdfChatSessionResponse,
  PdfChatSSEEvent,
  PdfChatSSEChunk,
  PdfChatSSEComplete,
  PdfChatSSEError,
} from '@/shared/types/pdfChat.types';

const BASE = () => `${authConfig.catenBaseUrl}/api/pdf-chat`;

function getFetcher(accessToken: string | null) {
  return accessToken ? fetchWithAuth : fetchPublic;
}

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

// 1. POST /preprocess
export async function preprocessPdf(
  accessToken: string | null,
  pdfId: string,
): Promise<PdfContentPreprocessResponse> {
  const fetcher = getFetcher(accessToken);
  const response = await fetcher(`${BASE()}/preprocess`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pdf_id: pdfId }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(getErrorMessage(errorData, 'Failed to start PDF preprocessing'));
  }

  return response.json();
}

// 2. GET /preprocess/{id}
export async function getPreprocessStatus(
  accessToken: string | null,
  preprocessId: string,
): Promise<PdfContentPreprocessResponse> {
  const fetcher = getFetcher(accessToken);
  const response = await fetcher(`${BASE()}/preprocess/${preprocessId}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(getErrorMessage(errorData, 'Failed to get preprocess status'));
  }

  return response.json();
}

// 3. POST /sessions
export async function createChatSession(
  accessToken: string | null,
  preprocessId: string,
): Promise<PdfChatSessionResponse> {
  const fetcher = getFetcher(accessToken);
  const response = await fetcher(`${BASE()}/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pdf_content_preprocess_id: preprocessId }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(getErrorMessage(errorData, 'Failed to create chat session'));
  }

  return response.json();
}

// 4. GET /sessions?pdf_content_preprocess_id=...
export async function listChatSessions(
  accessToken: string | null,
  preprocessId: string,
): Promise<PdfChatSessionResponse[]> {
  const fetcher = getFetcher(accessToken);
  const params = new URLSearchParams({ pdf_content_preprocess_id: preprocessId });
  const response = await fetcher(`${BASE()}/sessions?${params}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(getErrorMessage(errorData, 'Failed to list chat sessions'));
  }

  return response.json();
}

// 5. PATCH /sessions/{id}/rename
export async function renameChatSession(
  accessToken: string | null,
  sessionId: string,
  name: string,
): Promise<PdfChatSessionResponse> {
  const fetcher = getFetcher(accessToken);
  const response = await fetcher(`${BASE()}/sessions/${sessionId}/rename`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(getErrorMessage(errorData, 'Failed to rename session'));
  }

  return response.json();
}

// 6. DELETE /sessions/{id}
export async function deleteChatSession(
  accessToken: string | null,
  sessionId: string,
): Promise<void> {
  const fetcher = getFetcher(accessToken);
  const response = await fetcher(`${BASE()}/sessions/${sessionId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(getErrorMessage(errorData, 'Failed to delete session'));
  }
}

// 7. DELETE /sessions/{id}/chats
export async function clearChatSessionMessages(
  accessToken: string | null,
  sessionId: string,
): Promise<{ deleted_count: number }> {
  const fetcher = getFetcher(accessToken);
  const response = await fetcher(`${BASE()}/sessions/${sessionId}/chats`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(getErrorMessage(errorData, 'Failed to clear chat messages'));
  }

  return response.json();
}

// 8. POST /sessions/{id}/ask (SSE streaming)
async function* readSSEStream(
  response: Response,
  signal?: AbortSignal,
): AsyncGenerator<PdfChatSSEEvent, void, unknown> {
  if (!response.body) throw new ApiError('Response body is null');

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      if (signal?.aborted) {
        await reader.cancel();
        return;
      }

      const { done, value } = await reader.read();
      if (done) break;

      if (signal?.aborted) {
        await reader.cancel();
        return;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6).trim();
        if (data === '[DONE]') return;
        try {
          yield JSON.parse(data) as PdfChatSSEEvent;
        } catch {
          // skip malformed line
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

export type AskPdfYield =
  | { type: 'chunk'; chunk: string; accumulated: string }
  | { type: 'complete'; answer: string; citations: PdfChatSSEComplete['citations']; possibleQuestions: string[] }
  | { type: 'error'; errorCode: string; errorMessage: string };

export async function* askPdf(
  accessToken: string | null,
  sessionId: string,
  question: string,
  selectedText?: string,
  signal?: AbortSignal,
): AsyncGenerator<AskPdfYield, void, unknown> {
  const fetcher = getFetcher(accessToken);
  const response = await fetcher(`${BASE()}/sessions/${sessionId}/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
    body: JSON.stringify({
      pdf_chat_session_id: sessionId,
      question,
      selected_text: selectedText || undefined,
    }),
    signal,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const status = response.status;
    if (status === 409) {
      yield { type: 'error', errorCode: 'PREPROCESS_INCOMPLETE', errorMessage: 'PDF is still being processed. Please wait.' };
      return;
    }
    throw new ApiError(
      extractErrorMessage(errorData, `Ask PDF failed (${status})`),
      (errorData as any)?.detail?.error_code,
    );
  }

  for await (const raw of readSSEStream(response, signal)) {
    if ('type' in raw) {
      const typed = raw as PdfChatSSEComplete | PdfChatSSEError;
      if (typed.type === 'complete') {
        yield {
          type: 'complete',
          answer: typed.answer,
          citations: (typed as PdfChatSSEComplete).citations ?? [],
          possibleQuestions: (typed as PdfChatSSEComplete).possibleQuestions ?? [],
        };
        return;
      }
      if (typed.type === 'error') {
        yield {
          type: 'error',
          errorCode: (typed as PdfChatSSEError).error_code,
          errorMessage: (typed as PdfChatSSEError).error_message,
        };
        return;
      }
    } else if ('chunk' in raw) {
      const chunk = raw as PdfChatSSEChunk;
      yield { type: 'chunk', chunk: chunk.chunk, accumulated: chunk.accumulated };
    }
  }
}
