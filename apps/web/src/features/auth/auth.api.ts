import { apiClient } from '@/lib/api-client';

// Types copied by hand from the API (apps/api/src/auth/auth.service.ts → getMe).
// Keep them in sync when the API changes.

export type UserRole = 'ADMIN' | 'PHYSIO' | 'PATIENT';

/** The logged-in user, as returned by GET /api/auth/me and POST /api/auth/login */
export interface CurrentUser {
  id: string;
  role: UserRole;
  email: string | null;
  physiotherapist: { id: string; fullName: string } | null;
}

export interface LoginInput {
  email: string;
  password: string;
}

// The session token travels in an httpOnly cookie that the browser sends by itself:
// this code never sees or stores it.
export const authApi = {
  login: (data: LoginInput) => apiClient.post<CurrentUser>('/auth/login', data),
  logout: () => apiClient.post<void>('/auth/logout', {}),
  me: () => apiClient.get<CurrentUser>('/auth/me'),
};
