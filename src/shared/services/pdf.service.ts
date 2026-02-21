/**
 * PDF service
 *
 * Handles API calls for PDF operations
 */

import { authConfig } from '@/config/auth.config';
import { fetchWithAuth } from './api-client';
import type {
  GetAllPdfsResponse,
  PdfResponse,
  CreatePdfRequest,
  PresignedUploadRequest,
  PresignedUploadResponse,
  DownloadUrlResponse,
} from '@/shared/types/pdf.types';

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

/**
 * Get all PDFs for the authenticated user (with file_uploads)
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
    throw new Error(getErrorMessage(errorData, `Failed to fetch PDFs with status ${response.status}`));
  }

  const data: GetAllPdfsResponse = await response.json();
  return data;
}

/**
 * Create a PDF record (metadata only). Returns the created PDF with empty file_uploads.
 * Use getPresignedUploadUrl then PUT the file to the returned upload_url to attach the file.
 */
export async function createPdf(
  _accessToken: string,
  body: CreatePdfRequest
): Promise<PdfResponse> {
  const response = await fetchWithAuth(
    `${authConfig.catenBaseUrl}/api/pdf/create-pdf`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Failed to create PDF' }));
    throw new Error(getErrorMessage(errorData, `Failed to create PDF with status ${response.status}`));
  }

  const data: PdfResponse = await response.json();
  return data;
}

/** Max file name length for presigned-upload (must match backend PresignedUploadRequest). */
const PRESIGNED_UPLOAD_MAX_FILE_NAME_LENGTH = 255;

/**
 * Get a presigned S3 PUT URL for uploading a file. Creates a file_upload record.
 * Client must PUT the file to upload_url with Content-Type matching the file (e.g. application/pdf).
 * file_name is truncated to 255 characters to match backend validation.
 */
export async function getPresignedUploadUrl(
  _accessToken: string,
  body: PresignedUploadRequest
): Promise<PresignedUploadResponse> {
  const payload = {
    ...body,
    file_name:
      body.file_name.length > PRESIGNED_UPLOAD_MAX_FILE_NAME_LENGTH
        ? body.file_name.slice(0, PRESIGNED_UPLOAD_MAX_FILE_NAME_LENGTH)
        : body.file_name,
  };
  const response = await fetchWithAuth(
    `${authConfig.catenBaseUrl}/api/file-upload/presigned-upload`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Failed to get upload URL' }));
    throw new Error(getErrorMessage(errorData, `Failed to get upload URL with status ${response.status}`));
  }

  const data: PresignedUploadResponse = await response.json();
  return data;
}

/**
 * Get a presigned S3 GET URL for downloading a file by file_upload id.
 */
export async function getDownloadUrl(
  _accessToken: string,
  fileUploadId: string
): Promise<DownloadUrlResponse> {
  const response = await fetchWithAuth(
    `${authConfig.catenBaseUrl}/api/file-upload/download-url/${fileUploadId}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Failed to get download URL' }));
    throw new Error(getErrorMessage(errorData, `Failed to get download URL with status ${response.status}`));
  }

  const data: DownloadUrlResponse = await response.json();
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
    throw new Error(getErrorMessage(errorData, `Failed to delete PDF with status ${response.status}`));
  }

  // 204 No Content response - no body to parse
  return;
}
