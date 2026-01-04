/**
 * PDF-related TypeScript types
 * 
 * Matches the API models from the Caten backend
 */

export interface PdfResponse {
  id: string;
  file_name: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface GetAllPdfsResponse {
  pdfs: PdfResponse[];
}

export interface PdfHtmlPageResponse {
  id: string;
  page_no: number;
  pdf_id: string;
  html_content: string;
  created_at: string;
  updated_at: string;
}

export interface GetPdfHtmlPagesResponse {
  pages: PdfHtmlPageResponse[];
  total: number;
  offset: number;
  limit: number;
  has_next: boolean;
}

