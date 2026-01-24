/**
 * PDF service
 * 
 * Handles API calls for PDF operations
 */

import { authConfig } from '@/config/auth.config';
import { fetchWithAuth } from './api-client';
import type { GetAllPdfsResponse, PdfResponse, GetPdfHtmlPagesResponse } from '@/shared/types/pdf.types';

/**
 * Get all PDFs for the authenticated user
 */
export async function getAllPdfs(
  _accessToken: string
): Promise<GetAllPdfsResponse> {
  const response = await fetchWithAuth(
    `${authConfig.catenBaseUrl}/api/pdf`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Failed to fetch PDFs' }));
    const errorMessage = errorData.detail?.error_message || errorData.detail || `Failed to fetch PDFs with status ${response.status}`;
    throw new Error(errorMessage);
  }

  const data: GetAllPdfsResponse = await response.json();
  return data;
}

/**
 * Convert PDF to HTML
 * Uploads a PDF file and converts it to HTML format
 */
export async function convertPdfToHtml(
  _accessToken: string,
  file: File
): Promise<PdfResponse> {
  // Create FormData for multipart/form-data request
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetchWithAuth(
    `${authConfig.catenBaseUrl}/api/pdf/to-html`,
    {
      method: 'POST',
      headers: {
        // Don't set Content-Type header - let browser set it with boundary for multipart/form-data
      },
      body: formData,
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Failed to convert PDF' }));
    const errorMessage = errorData.detail?.error_message || errorData.detail || `Failed to convert PDF with status ${response.status}`;
    throw new Error(errorMessage);
  }

  const data: PdfResponse = await response.json();
  return data;
}

/**
 * Get HTML pages for a specific PDF
 * Retrieves paginated HTML pages for a PDF
 */
export async function getHtmlPagesByPdfId(
  _accessToken: string,
  pdfId: string,
  offset: number = 0,
  limit: number = 20
): Promise<GetPdfHtmlPagesResponse> {
  const response = await fetchWithAuth(
    `${authConfig.catenBaseUrl}/api/pdf/${pdfId}/html?offset=${offset}&limit=${limit}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Failed to fetch PDF HTML pages' }));
    const errorMessage = errorData.detail?.error_message || errorData.detail || `Failed to fetch PDF HTML pages with status ${response.status}`;
    throw new Error(errorMessage);
  }

  const data: GetPdfHtmlPagesResponse = await response.json();
  return data;
}

/**
 * Delete a PDF
 * Deletes a PDF by ID for the authenticated user
 */
export async function deletePdf(
  _accessToken: string,
  pdfId: string
): Promise<void> {
  const response = await fetchWithAuth(
    `${authConfig.catenBaseUrl}/api/pdf/${pdfId}`,
    {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Failed to delete PDF' }));
    const errorMessage = errorData.detail?.error_message || errorData.detail || `Failed to delete PDF with status ${response.status}`;
    throw new Error(errorMessage);
  }

  // 204 No Content response - no body to parse
  return;
}

