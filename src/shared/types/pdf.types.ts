/**
 * PDF-related TypeScript types
 *
 * Matches the API models from the Caten backend
 */

export interface FileUploadResponse {
  id: string;
  file_name: string;
  file_type: string;
  entity_type: string;
  entity_id: string;
  s3_url: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface PdfResponse {
  id: string;
  file_name: string;
  folder_id?: string;
  /** Set on copies created via the create-copy endpoint — references the source PDF */
  parent_id?: string;
  created_by: string;
  access_level: 'PUBLIC' | 'PRIVATE';
  created_at: string;
  updated_at: string;
  file_uploads: FileUploadResponse[];
}

export interface GetAllPdfsResponse {
  pdfs: PdfResponse[];
}

export interface CreatePdfRequest {
  file_name: string;
  folder_id?: string;
}

export interface PresignedUploadRequest {
  file_name: string;
  file_type: 'IMAGE' | 'PDF';
  entity_type: 'ISSUE' | 'PDF';
  entity_id: string;
}

export interface PresignedUploadResponse {
  upload_url: string;
  file_upload_id: string;
  content_type: string;
  expires_in: number;
  max_file_size_bytes: number;
}

export interface DownloadUrlResponse {
  download_url: string;
  expires_in: number;
}

export interface PdfShareResponse {
  id: string;
  pdf_id: string;
  shared_to_email: string;
  created_at: string;
}

export interface SharedPdfItem {
  id: string;
  file_name: string;
  created_by: string | null;
  folder_id: string | null;
  created_at: string;
  updated_at: string;
  shared_at: string;
}

export interface GetSharedPdfsResponse {
  pdfs: SharedPdfItem[];
}
