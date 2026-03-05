/**
 * Simplify and Ask services for the "Explain text on PDF" feature.
 *
 * Uses fetchWithAuth + SSE streaming, matching the pattern in paragraphs.service.ts.
 */

import { authConfig } from '@/config/auth.config';
import { fetchWithAuth, extractErrorMessage, ApiError } from './api-client';

// ── Types ────────────────────────────────────────────────────────────────────

export interface SimplifyRequest {
  textStartIndex: number;
  textLength: number;
  /** Surrounding context: 15 words before + selected text + 15 words after */
  text: string;
  previousSimplifiedTexts: string[];
  languageCode?: string | null;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AskRequest {
  question: string;
  chat_history: ChatMessage[];
  initial_context?: string;
  context_type: 'TEXT';
  languageCode?: string | null;
}

// ── SSE event shapes ──────────────────────────────────────────────────────────

interface SimplifyChunkEvent {
  chunk: string;
  accumulatedSimplifiedText: string;
}

interface SimplifyCompleteEvent {
  type: 'complete';
  simplifiedText: string;
  shouldAllowSimplifyMore: boolean;
  possibleQuestions?: string[];
}

interface SimplifyErrorEvent {
  type: 'error';
  error_code: string;
  error_message: string;
}

type SimplifyEvent = SimplifyChunkEvent | SimplifyCompleteEvent | SimplifyErrorEvent;

interface AskChunkEvent {
  chunk: string;
  accumulated: string;
}

interface AskCompleteEvent {
  type: 'complete';
  chat_history: ChatMessage[];
  possibleQuestions: string[];
}

interface AskErrorEvent {
  type: 'error';
  error_code: string;
  error_message: string;
}

type AskEvent = AskChunkEvent | AskCompleteEvent | AskErrorEvent;

// ── Public response types yielded by the generators ─────────────────────────

export type SimplifySSEResponse =
  | { type: 'chunk'; chunk: string; accumulatedText: string }
  | { type: 'complete'; simplifiedText: string; shouldAllowSimplifyMore: boolean; possibleQuestions: string[] }
  | { type: 'error'; errorCode: string; errorMessage: string };

export type AskSSEResponse =
  | { type: 'chunk'; chunk: string; accumulatedText: string }
  | { type: 'complete'; chatHistory: ChatMessage[]; possibleQuestions: string[] }
  | { type: 'error'; errorCode: string; errorMessage: string };

// ── Helpers ──────────────────────────────────────────────────────────────────

async function* readSSEStream<T>(
  response: Response,
  signal?: AbortSignal,
): AsyncGenerator<T, void, unknown> {
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
          yield JSON.parse(data) as T;
        } catch {
          // skip malformed line
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

// ── simplifyText ─────────────────────────────────────────────────────────────

/**
 * Stream an AI explanation for selected PDF text.
 * Yields SimplifySSEResponse objects until complete or error.
 */
export async function* simplifyText(
  requests: SimplifyRequest[],
  signal?: AbortSignal,
): AsyncGenerator<SimplifySSEResponse, void, unknown> {
  if (!requests.length) throw new ApiError('requests must contain at least one item');

  const response = await fetchWithAuth(
    `${authConfig.catenBaseUrl}/api/v2/simplify`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
      body: JSON.stringify(requests),
      signal,
    },
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(extractErrorMessage(errorData, 'Failed to simplify text'), errorData?.detail?.errorCode);
  }

  for await (const raw of readSSEStream<SimplifyEvent>(response, signal)) {
    if ('type' in raw) {
      if (raw.type === 'complete') {
        yield {
          type: 'complete',
          simplifiedText: raw.simplifiedText,
          shouldAllowSimplifyMore: raw.shouldAllowSimplifyMore,
          possibleQuestions: raw.possibleQuestions ?? [],
        };
        return;
      }
      if (raw.type === 'error') {
        yield { type: 'error', errorCode: raw.error_code, errorMessage: raw.error_message };
        return;
      }
    } else if ('chunk' in raw && 'accumulatedSimplifiedText' in raw) {
      yield { type: 'chunk', chunk: raw.chunk, accumulatedText: raw.accumulatedSimplifiedText };
    }
  }
}

// ── askAboutText ──────────────────────────────────────────────────────────────

/**
 * Ask a follow-up question about explained PDF text.
 * Yields AskSSEResponse objects until complete or error.
 */
export async function* askAboutText(
  request: AskRequest,
  signal?: AbortSignal,
): AsyncGenerator<AskSSEResponse, void, unknown> {
  const response = await fetchWithAuth(
    `${authConfig.catenBaseUrl}/api/v2/ask`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
      body: JSON.stringify(request),
      signal,
    },
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(extractErrorMessage(errorData, 'Failed to ask about text'), errorData?.detail?.errorCode);
  }

  for await (const raw of readSSEStream<AskEvent>(response, signal)) {
    if ('type' in raw) {
      if (raw.type === 'complete') {
        yield {
          type: 'complete',
          chatHistory: raw.chat_history,
          possibleQuestions: raw.possibleQuestions ?? [],
        };
        return;
      }
      if (raw.type === 'error') {
        yield { type: 'error', errorCode: raw.error_code, errorMessage: raw.error_message };
        return;
      }
    } else if ('chunk' in raw) {
      yield { type: 'chunk', chunk: raw.chunk, accumulatedText: raw.accumulated };
    }
  }
}
