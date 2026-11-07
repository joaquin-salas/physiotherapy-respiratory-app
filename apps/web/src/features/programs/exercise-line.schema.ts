import { z } from 'zod';
import type { RoutineExercise, RoutineExerciseInput } from './programs.api';

// One exercise line (exercise + prescription). Shared by the program builder and
// the routine template editor, which use exactly the same fields and rules.

// Numbers are kept as text in the form (an empty input must stay empty, not 0 or NaN).
export const isIntBetween = (text: string, min: number, max: number) => {
  const n = Number(text);
  return text.trim() !== '' && Number.isInteger(n) && n >= min && n <= max;
};

const intField = (min: number, max: number) =>
  z.string().refine((text) => isIntBetween(text, min, max), {
    error: `Entre ${min} y ${max}`,
  });

/** Limits for the amount, depending on whether the exercise is counted in reps or time */
export const AMOUNT_LIMITS = {
  reps: { min: 1, max: 200 },
  time: { min: 5, max: 7200 }, // seconds
} as const;

export const lineSchema = z
  .object({
    id: z.string().optional(), // existing line (edit mode)
    exerciseId: z.string().min(1, 'Elige un ejercicio'),
    sets: intField(1, 20),
    mode: z.enum(['reps', 'time']), // counted in repetitions or in seconds
    amount: z.string(),
    restSec: intField(0, 600),
    targetEffort: z.string(), // '' = not set, or '10' … '100'
    notes: z.string(),
  })
  .superRefine((line, ctx) => {
    const { min, max } = AMOUNT_LIMITS[line.mode];
    if (!isIntBetween(line.amount, min, max)) {
      ctx.addIssue({
        code: 'custom',
        path: ['amount'],
        message: `Entre ${min} y ${max}`,
      });
    }
  });

export type LineValues = z.infer<typeof lineSchema>;

/** A new exercise line with common defaults: 3 × 10, 60 s rest, no target effort */
export const emptyLine: LineValues = {
  exerciseId: '',
  sets: '3',
  mode: 'reps',
  amount: '10',
  restSec: '60',
  targetEffort: '',
  notes: '',
};

/** A saved line (from a program or a template) → form values. `keepId` only when editing it. */
export function toLineValues(
  line: Omit<RoutineExercise, 'id' | 'exercise' | 'order'> & { id?: string },
  keepId: boolean,
): LineValues {
  return {
    id: keepId ? line.id : undefined,
    exerciseId: line.exerciseId,
    sets: String(line.sets),
    mode: line.reps !== null ? 'reps' : 'time',
    amount: String(line.reps ?? line.durationSec ?? ''),
    restSec: String(line.restSec),
    targetEffort:
      line.targetEffortPct === null ? '' : String(line.targetEffortPct),
    notes: line.notes ?? '',
  };
}

/** Form values → API body of one line */
export function toLineInput(line: LineValues): RoutineExerciseInput {
  return {
    id: line.id,
    exerciseId: line.exerciseId,
    sets: Number(line.sets),
    reps: line.mode === 'reps' ? Number(line.amount) : null,
    durationSec: line.mode === 'time' ? Number(line.amount) : null,
    restSec: Number(line.restSec),
    targetEffortPct: line.targetEffort ? Number(line.targetEffort) : null,
    notes: line.notes.trim() || null,
  };
}
