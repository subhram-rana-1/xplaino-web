export type PreprocessStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';

export interface PdfContentPreprocessResponse {
  id: string;
  pdf_id: string;
  status: PreprocessStatus;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface PdfChatSessionResponse {
  id: string;
  name: string;
  pdf_content_preprocess_id: string;
  user_id: string | null;
  unauthenticated_user_id: string | null;
  owner_label: string | null;
  created_at: string;
  updated_at: string;
}

export interface PdfChatCitationItem {
  chunkSequence: number;
  pageNumber: number | null;
  content: string;
}

export interface PdfChatMessageResponse {
  id: string;
  pdf_chat_session_id: string;
  who: 'USER' | 'SYSTEM';
  chat: string;
  citations: PdfChatCitationItem[] | null;
  created_at: string;
}

export interface PdfChatSSEChunk {
  chunk: string;
  accumulated: string;
}

export interface PdfChatSSEComplete {
  type: 'complete';
  answer: string;
  citations: PdfChatCitationItem[];
  possibleQuestions: string[];
}

export interface PdfChatSSEError {
  type: 'error';
  error_code: string;
  error_message: string;
}

export type PdfChatSSEEvent = PdfChatSSEChunk | PdfChatSSEComplete | PdfChatSSEError;

export interface UpsertPreprocessRequest {
  pdf_id: string;
}

export interface CreateSessionRequest {
  pdf_content_preprocess_id: string;
}

export interface RenameSessionRequest {
  name: string;
}

export interface AskPdfRequest {
  pdf_chat_session_id: string;
  question: string;
  selected_text?: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  citations?: PdfChatCitationItem[];
  selectedText?: string;
}
