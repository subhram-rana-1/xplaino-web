/**
 * PDF service
 *
 * Handles API calls for PDF operations
 */

import { authConfig } from '@/config/auth.config';
import { fetchWithAuth, fetchPublic } from './api-client';
import type {
  GetAllPdfsResponse,
  PdfResponse,
  CreatePdfRequest,
  PresignedUploadRequest,
  PresignedUploadResponse,
  DownloadUrlResponse,
  PdfShareResponse,
  GetSharedPdfsResponse,
} from '@/shared/types/pdf.types';
import type { GetShareeListResponse } from '@/shared/types/folders.types';

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
 * Get a single PDF by ID. Works for both authenticated and unauthenticated users.
 * Authenticated: sends Authorization header via fetchWithAuth.
 * Unauthenticated: sends X-Unauthenticated-User-Id header via fetchPublic.
 * The response includes file_uploads with presigned s3_url — no separate download-url call needed.
 */
export async function getPdfById(
  pdfId: string,
  accessToken: string | null
): Promise<PdfResponse> {
  const fetcher = accessToken ? fetchWithAuth : fetchPublic;
  const response = await fetcher(
    `${authConfig.catenBaseUrl}/api/pdf/${pdfId}`,
    {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Failed to fetch PDF' }));
    throw new Error(getErrorMessage(errorData, `Failed to fetch PDF with status ${response.status}`));
  }

  const data: PdfResponse = await response.json();
  return data;
}

/**
 * Get all PDFs for the authenticated user (with file_uploads).
 * If folderId is provided, only PDFs in that folder are returned.
 */
export async function getAllPdfs(
  _accessToken: string,
  folderId?: string
): Promise<GetAllPdfsResponse> {
  const url = folderId
    ? `${authConfig.catenBaseUrl}/api/pdf?folder_id=${folderId}`
    : `${authConfig.catenBaseUrl}/api/pdf`;
  const response = await fetchWithAuth(
    url,
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
 * Make a PDF publicly accessible (no authentication required to view)
 */
export async function makePdfPublic(
  _accessToken: string,
  pdfId: string
): Promise<PdfResponse> {
  const response = await fetchWithAuth(
    `${authConfig.catenBaseUrl}/api/pdf/${pdfId}/make-public`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Failed to make PDF public' }));
    throw new Error(getErrorMessage(errorData, `Failed to make PDF public with status ${response.status}`));
  }

  return response.json() as Promise<PdfResponse>;
}

/**
 * Make a PDF private (only owner and sharees can view)
 */
export async function makePdfPrivate(
  _accessToken: string,
  pdfId: string
): Promise<PdfResponse> {
  const response = await fetchWithAuth(
    `${authConfig.catenBaseUrl}/api/pdf/${pdfId}/make-private`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Failed to make PDF private' }));
    throw new Error(getErrorMessage(errorData, `Failed to make PDF private with status ${response.status}`));
  }

  return response.json() as Promise<PdfResponse>;
}

/**
 * Create a private copy of a PUBLIC PDF under the current user's ownership.
 * Optionally place the copy in a specific folder.
 */
export async function createPdfCopy(
  _accessToken: string,
  pdfId: string,
  folderId?: string
): Promise<PdfResponse> {
  const body = folderId ? { folder_id: folderId } : {};
  const response = await fetchWithAuth(
    `${authConfig.catenBaseUrl}/api/pdf/${pdfId}/create-copy`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Failed to create PDF copy' }));
    throw new Error(getErrorMessage(errorData, `Failed to create PDF copy with status ${response.status}`));
  }

  return response.json() as Promise<PdfResponse>;
}

/**
 * Share a PDF with another user by email
 */
export async function sharePdf(
  _accessToken: string,
  pdfId: string,
  email: string
): Promise<PdfShareResponse> {
  const response = await fetchWithAuth(
    `${authConfig.catenBaseUrl}/api/pdf/${pdfId}/share`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Failed to share PDF' }));
    throw new Error(getErrorMessage(errorData, `Failed to share PDF with status ${response.status}`));
  }

  return response.json() as Promise<PdfShareResponse>;
}

/**
 * Unshare a PDF from a user by email
 */
export async function unsharePdf(
  _accessToken: string,
  pdfId: string,
  email: string
): Promise<void> {
  const response = await fetchWithAuth(
    `${authConfig.catenBaseUrl}/api/pdf/${pdfId}/share`,
    {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Failed to unshare PDF' }));
    throw new Error(getErrorMessage(errorData, `Failed to unshare PDF with status ${response.status}`));
  }
}

/**
 * Get the list of users (sharees) a PDF has been shared with
 */
export async function getPdfShareeList(
  _accessToken: string,
  pdfId: string
): Promise<GetShareeListResponse> {
  const response = await fetchWithAuth(
    `${authConfig.catenBaseUrl}/api/pdf/${pdfId}/share`,
    {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Failed to fetch PDF sharee list' }));
    throw new Error(getErrorMessage(errorData, `Failed to fetch PDF sharee list with status ${response.status}`));
  }

  return response.json() as Promise<GetShareeListResponse>;
}

/**
 * Get all PDFs shared directly with the authenticated user
 */
export async function getSharedPdfs(
  _accessToken: string
): Promise<GetSharedPdfsResponse> {
  const response = await fetchWithAuth(
    `${authConfig.catenBaseUrl}/api/pdf/shared-with-me`,
    {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Failed to fetch shared PDFs' }));
    throw new Error(getErrorMessage(errorData, `Failed to fetch shared PDFs with status ${response.status}`));
  }

  return response.json() as Promise<GetSharedPdfsResponse>;
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
