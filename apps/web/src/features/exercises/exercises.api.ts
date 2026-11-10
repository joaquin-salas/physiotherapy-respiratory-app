import { apiClient } from '@/lib/api-client';

// Types copied by hand from the API (apps/api/prisma/schema.prisma + DTOs).
// Keep them in sync when the API changes.

export const EXERCISE_GOALS = [
  'STRENGTH',
  'AEROBIC',
  'RESPIRATORY',
  'BALANCE',
  'MOBILITY',
] as const;

export type ExerciseGoal = (typeof EXERCISE_GOALS)[number];

/** An exercise as returned by the API */
export interface Exercise {
  id: string;
  name: string;
  description: string;
  videoUrl: string | null;
  goal: ExerciseGoal;
  level: number;
  equipment: string[];
  contraindications: string | null;
  createdAt: string; // ISO date (JSON has no Date type)
  updatedAt: string;
}

/**
 * Body of POST /api/exercises and PATCH /api/exercises/:id (matches CreateExerciseDto in the API).
 * null clears an optional field.
 */
export interface ExerciseInput {
  name: string;
  description: string;
  goal: ExerciseGoal;
  level?: number;
  equipment?: string[];
  videoUrl?: string | null;
  contraindications?: string | null;
}

export const exercisesApi = {
  getAll: () => apiClient.get<Exercise[]>('/exercises'),
  getOne: (id: string) => apiClient.get<Exercise>(`/exercises/${id}`),
  create: (data: ExerciseInput) => apiClient.post<Exercise>('/exercises', data),
  update: (id: string, data: ExerciseInput) =>
    apiClient.patch<Exercise>(`/exercises/${id}`, data),
  remove: (id: string) => apiClient.delete<Exercise>(`/exercises/${id}`),
};
