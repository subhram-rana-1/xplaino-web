/**
 * Paragraphs-related TypeScript types
 * 
 * Matches the API models from the Caten backend
 */

export interface Folder {
  id: string;
  name: string;
  type: string;
  parent_id: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface SavedParagraph {
  id: string;
  name: string | null;
  source_url: string;
  content: string;
  folder_id: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface GetAllSavedParagraphsResponse {
  folder_id: string | null;
  user_id: string;
  sub_folders: Folder[];
  saved_paragraphs: SavedParagraph[];
  total: number;
  offset: number;
  limit: number;
  has_next: boolean;
}

export interface SavedParagraphsState {
  folder_id: string | null;
  user_id: string;
  sub_folders: Folder[];
  saved_paragraphs: SavedParagraph[];
  total: number;
  offset: number;
  limit: number;
  has_next: boolean;
  isLoading: boolean;
  isLoaded: boolean;
  currentFolderPath: Array<{ id: string; name: string }>;
}

/**
 * Chat message for Ask AI conversations
 */
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * User question type enum for Ask AI endpoint
 */
export enum UserQuestionType {
  SHORT_SUMMARY = 'SHORT_SUMMARY',
  DESCRIPTIVE_NOTE = 'DESCRIPTIVE_NOTE',
  CUSTOM = 'CUSTOM',
}

/**
 * Request model for asking AI about saved paragraphs
 */
export interface AskSavedParagraphsRequest {
  initialContext: string[];  // Array of content strings (required, min 1 item)
  chatHistory: ChatMessage[];  // Previous chat history for context (can be empty)
  userQuestionType: UserQuestionType;  // Type of question
  userQuestion?: string;  // Custom user question (required when userQuestionType is CUSTOM, must have length > 0)
  languageCode?: string | null;  // Optional language code (max 10 chars, e.g., 'EN', 'FR', 'ES', 'DE', 'HI')
}

/**
 * Streaming response chunk from Ask AI endpoint
 */
export interface AskAIStreamChunk {
  chunk: string;
  accumulated: string;
}

/**
 * Final completion response from Ask AI endpoint
 */
export interface AskAICompleteResponse {
  type: 'complete';
  answer: string;
}

/**
 * Error response from Ask AI endpoint
 */
export interface AskAIErrorResponse {
  type: 'error';
  error_code: string;
  error_message: string;
}

/**
 * Union type for all possible SSE response types
 */
export type AskAISSEResponse = AskAIStreamChunk | AskAICompleteResponse | AskAIErrorResponse;

