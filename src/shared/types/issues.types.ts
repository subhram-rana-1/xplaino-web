/**
 * Issues-related TypeScript types
 * 
 * Matches the API models from the Caten backend
 */

import type { CreatedByUser } from '@/shared/types/comments.types';

export enum IssueType {
  GLITCH = 'GLITCH',
  SUBSCRIPTION = 'SUBSCRIPTION',
  AUTHENTICATION = 'AUTHENTICATION',
  FEATURE_REQUEST = 'FEATURE_REQUEST',
  OTHERS = 'OTHERS',
}

export enum IssueStatus {
  OPEN = 'OPEN',
  WORK_IN_PROGRESS = 'WORK_IN_PROGRESS',
  DISCARDED = 'DISCARDED',
  RESOLVED = 'RESOLVED',
}

export interface ReportIssueRequest {
  type: IssueType;
  heading?: string | null;
  description: string;
  webpage_url?: string | null;
}

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

export interface IssueResponse {
  id: string;
  ticket_id: string;
  type: string;
  heading: string | null;
  description: string;
  webpage_url: string | null;
  status: string;
  created_by: string;
  closed_by: string | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
  file_uploads: FileUploadResponse[];
}

export interface GetMyIssuesResponse {
  issues: IssueResponse[];
}

export interface GetAllIssuesResponse {
  issues: IssueResponse[];
  total: number;
  offset: number;
  limit: number;
  has_next: boolean;
}

export interface GetAllIssuesFilters {
  ticket_id?: string;
  type?: string;
  status?: string;
  closed_by?: string;
  offset?: number;
  limit?: number;
}

export interface UpdateIssueRequest {
  status: IssueStatus;
}

export interface GetIssueByTicketIdResponse {
  id: string;
  ticket_id: string;
  type: string;
  heading: string | null;
  description: string;
  webpage_url: string | null;
  status: string;
  created_by: CreatedByUser;
  closed_by: CreatedByUser | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
  file_uploads: FileUploadResponse[];
}

