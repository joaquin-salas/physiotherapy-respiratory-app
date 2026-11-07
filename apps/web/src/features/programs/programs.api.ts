import type { ExerciseGoal } from '@/features/exercises/exercises.api';
import { apiClient } from '@/lib/api-client';

// Types copied by hand from the API (apps/api/prisma/schema.prisma + programs DTOs).
// Keep them in sync when the API changes.

/** In week order, Monday first (Spanish calendars) */
export const WEEKDAYS = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
] as const;
export type Weekday = (typeof WEEKDAYS)[number];

export const PROGRAM_PROFILES = [
  'PREHAB',
  'POST_SURGERY',
  'DURING_TREATMENT',
  'SURVIVOR',
] as const;
export type ProgramProfile = (typeof PROGRAM_PROFILES)[number];

/** Same limit as the API (MAX_ROUTINES): physios said two routines at most */
export const MAX_ROUTINES = 2;

/** One exercise of a routine, with its prescription */
export interface RoutineExercise {
  id: string;
  exerciseId: string;
  order: number;
  sets: number;
  reps: number | null; // either reps or durationSec
  durationSec: number | null;
  restSec: number;
  targetEffortPct: number | null; // target perceived effort, 0–100 in steps of 10
  notes: string | null;
  exercise: { id: string; name: string; goal: ExerciseGoal; level: number };
}

/** A fixed session repeated on some days of the week */
export interface Routine {
  id: string;
  name: string;
  order: number;
  daysOfWeek: Weekday[];
  exercises: RoutineExercise[];
}

export interface Program {
  id: string;
  patientId: string;
  name: string;
  profile: ProgramProfile | null;
  status: 'ACTIVE' | 'ENDED';
  startDate: string; // ISO date
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
  routines: Routine[];
}

/** One exercise in the body of POST/PUT. `id` only for lines that already exist (edit). */
export interface RoutineExerciseInput {
  id?: string;
  exerciseId: string;
  sets: number;
  reps: number | null;
  durationSec: number | null;
  restSec: number;
  targetEffortPct: number | null;
  notes: string | null;
}

export interface RoutineInput {
  id?: string;
  name: string;
  daysOfWeek: Weekday[];
  exercises: RoutineExerciseInput[]; // in session order
}

/** Body of POST /api/patients/:id/programs and PUT /api/programs/:id (always the whole program) */
export interface SaveProgramInput {
  name: string;
  profile: ProgramProfile | null;
  startDate: string; // "YYYY-MM-DD"
  routines: RoutineInput[];
}

export const programsApi = {
  getForPatient: (patientId: string) =>
    apiClient.get<Program[]>(`/patients/${patientId}/programs`),
  create: (patientId: string, data: SaveProgramInput) =>
    apiClient.post<Program>(`/patients/${patientId}/programs`, data),
  update: (id: string, data: SaveProgramInput) =>
    apiClient.put<Program>(`/programs/${id}`, data),
  end: (id: string) => apiClient.post<Program>(`/programs/${id}/end`, {}),
};
