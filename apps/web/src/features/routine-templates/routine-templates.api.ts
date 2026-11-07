import type {
  ProgramProfile,
  RoutineExercise,
  RoutineExerciseInput,
} from '@/features/programs/programs.api';
import { apiClient } from '@/lib/api-client';

// Types copied by hand from the API (apps/api/prisma/schema.prisma + routine-templates DTOs).
// Keep them in sync when the API changes.

/** A pre-established routine in the shared library. No days: chosen per patient. */
export interface RoutineTemplate {
  id: string;
  name: string;
  profile: ProgramProfile | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  /** Same shape as a patient's routine exercises */
  exercises: RoutineExercise[];
}

/** Body of POST /api/routine-templates and PUT /api/routine-templates/:id (the whole template) */
export interface SaveRoutineTemplateInput {
  name: string;
  profile: ProgramProfile | null;
  description: string | null;
  exercises: RoutineExerciseInput[]; // in session order
}

export const routineTemplatesApi = {
  getAll: (profile?: ProgramProfile) =>
    apiClient.get<RoutineTemplate[]>(
      profile ? `/routine-templates?profile=${profile}` : '/routine-templates',
    ),
  create: (data: SaveRoutineTemplateInput) =>
    apiClient.post<RoutineTemplate>('/routine-templates', data),
  update: (id: string, data: SaveRoutineTemplateInput) =>
    apiClient.put<RoutineTemplate>(`/routine-templates/${id}`, data),
  delete: (id: string) => apiClient.delete<void>(`/routine-templates/${id}`),
};
