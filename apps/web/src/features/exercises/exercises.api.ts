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

/** Body of POST /api/exercises (matches CreateExerciseDto in the API) */
export interface CreateExerciseInput {
  name: string;
  description: string;
  goal: ExerciseGoal;
  level?: number;
  equipment?: string[];
  videoUrl?: string;
  contraindications?: string;
}

export const exercisesApi = {
  getAll: () => apiClient.get<Exercise[]>('/exercises'),
  create: (data: CreateExerciseInput) =>
    apiClient.post<Exercise>('/exercises', data),
};
