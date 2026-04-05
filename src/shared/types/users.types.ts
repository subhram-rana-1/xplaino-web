/**
 * Users TypeScript types
 *
 * Matches the API models from the Caten backend (/api/users)
 */

export interface AdminUserResponse {
  id: string;
  email: string | null;
  email_verified: boolean | null;
  first_name: string | null;
  last_name: string | null;
  picture: string | null;
  role: string | null;
  locale: string | null;
  hd: string | null;
  created_at: string;
  updated_at: string;
}

export interface GetAllUsersResponse {
  users: AdminUserResponse[];
  total: number;
  offset: number;
  limit: number;
  has_next: boolean;
}

export interface GetAllUsersFilters {
  email?: string;
  role?: string;
  offset?: number;
  limit?: number;
}
