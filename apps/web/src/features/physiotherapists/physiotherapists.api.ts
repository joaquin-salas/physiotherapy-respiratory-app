import { apiClient } from '@/lib/api-client';

// Types copied by hand from the API (apps/api/src/physiotherapists). Keep them in sync.

export interface PhysiotherapistSummary {
  id: string;
  fullName: string;
}

export const physiotherapistsApi = {
  /** Admins only */
  getAll: () => apiClient.get<PhysiotherapistSummary[]>('/physiotherapists'),
};
