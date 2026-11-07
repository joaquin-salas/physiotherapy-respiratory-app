import type { ExerciseGoal } from './exercises.api';

/** Text shown to physios for each goal (the API uses the English codes). */
export const goalLabels: Record<ExerciseGoal, string> = {
  STRENGTH: 'Fuerza',
  AEROBIC: 'Aeróbico',
  RESPIRATORY: 'Respiratorio',
  BALANCE: 'Equilibrio',
  MOBILITY: 'Movilidad',
};
