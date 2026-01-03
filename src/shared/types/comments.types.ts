/**
 * Comments-related TypeScript types
 * 
 * Matches the API models from the Caten backend
 */

export enum EntityType {
  ISSUE = 'ISSUE',
}

export enum CommentVisibility {
  PUBLIC = 'PUBLIC',
  INTERNAL = 'INTERNAL',
}

export interface CreatedByUser {
  id: string;
  name: string;
  profileIconUrl?: string | null;
  role?: 'ADMIN' | 'SUPER_ADMIN' | null;
}

export interface CommentResponse {
  id: string;
  content: string;
  visibility: string;
  child_comments: CommentResponse[];
  created_by: CreatedByUser;
  created_at: string;
  updated_at: string;
}

export interface GetCommentsResponse {
  comments: CommentResponse[];
}

export interface CreateCommentRequest {
  entity_type: EntityType;
  entity_id: string;
  content: string;
  visibility: CommentVisibility;
  parent_comment_id?: string | null;
}

export interface CreateCommentResponse {
  id: string;
  content: string;
  entity_type: string;
  entity_id: string;
  parent_comment_id: string | null;
  visibility: string;
  created_by: CreatedByUser;
  created_at: string;
  updated_at: string;
}

