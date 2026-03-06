export type ChatWho = 'USER' | 'SYSTEM';

export interface ChatMessageItem {
  who: ChatWho;
  content: string;
}

export interface CreatePdfTextChatRequest {
  start_text_pdf_page_number: number;
  end_text_pdf_page_number: number;
  start_text: string;
  end_text: string;
  chats?: ChatMessageItem[];
}

export interface AppendPdfTextChatMessagesRequest {
  chats: ChatMessageItem[];
}

export interface PdfTextChatResponse {
  id: string;
  pdf_id: string;
  user_id: string;
  start_text_pdf_page_number: number;
  end_text_pdf_page_number: number;
  start_text: string;
  end_text: string;
  created_at: string;
  updated_at: string;
}

export interface PdfTextChatHistoryItemResponse {
  id: string;
  pdf_text_chat_id: string;
  who: ChatWho;
  content: string;
  created_at: string;
}

export interface GetAllPdfTextChatsResponse {
  pdf_id: string;
  chats: PdfTextChatResponse[];
}

export interface GetPdfTextChatHistoryResponse {
  pdf_text_chat_id: string;
  messages: PdfTextChatHistoryItemResponse[];
  total: number;
  offset: number;
  limit: number;
}

export interface CreatePdfTextChatResponse {
  chat: PdfTextChatResponse;
  messages: PdfTextChatHistoryItemResponse[];
}
