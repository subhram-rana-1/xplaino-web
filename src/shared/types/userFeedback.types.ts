/**
 * User Feedback TypeScript types
 *
 * Matches the API models from the Caten backend (/api/user-feedback/*)
 */

export enum UserFeedbackVerdict {
  UNHAPPY = 'UNHAPPY',
  NEUTRAL = 'NEUTRAL',
  HAPPY = 'HAPPY',
}

export interface UserFeedbackQnA {
  question: string;
  answer: string;
}

export interface UserFeedbackMetadata {
  qna: UserFeedbackQnA[];
}

export interface UserFeedbackResponse {
  id: string;
  user_id: string;
  user_email: string | null;
  verdict: string;
  metadata: UserFeedbackMetadata;
  created_at: string;
  updated_at: string;
}

export interface GetAllUserFeedbacksResponse {
  feedbacks: UserFeedbackResponse[];
  total: number;
  offset: number;
  limit: number;
  has_next: boolean;
}

export interface GetAllUserFeedbacksFilters {
  verdict?: string;
  email?: string;
  offset?: number;
  limit?: number;
}
