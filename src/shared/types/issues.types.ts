/**
 * Issues-related TypeScript types
 * 
 * Matches the API models from the Caten backend
 */

export enum IssueType {
  GLITCH = 'GLITCH',
  SUBSCRIPTION = 'SUBSCRIPTION',
  AUTHENTICATION = 'AUTHENTICATION',
  FEATURE_REQUEST = 'FEATURE_REQUEST',
  OTHERS = 'OTHERS',
}

export interface ReportIssueRequest {
  type: IssueType;
  heading?: string | null;
  description: string;
  webpage_url?: string | null;
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
}

export interface GetMyIssuesResponse {
  issues: IssueResponse[];
}

