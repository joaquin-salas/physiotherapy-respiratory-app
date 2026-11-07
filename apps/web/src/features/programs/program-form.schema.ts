import { z } from 'zod';
import {
  PROGRAM_PROFILES,
  WEEKDAYS,
  type Program,
  type SaveProgramInput,
  type Weekday,
} from './programs.api';
import { routineName, weekdayLong } from './programs.labels';

// Numbers are kept as text in the form (an empty input must stay empty, not 0 or NaN).
const isIntBetween = (text: string, min: number, max: number) => {
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

const lineSchema = z
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

const routineSchema = z.object({
  id: z.string().optional(), // existing routine (edit mode)
  name: z.string().trim().min(1, 'Ponle un nombre a la rutina'),
  daysOfWeek: z.array(z.enum(WEEKDAYS)).min(1, 'Elige al menos un día'),
  exercises: z.array(lineSchema).min(1, 'Añade al menos un ejercicio'),
});

/**
 * Validation rules for the program builder.
 * The API validates again: browser checks are for convenience, not security.
 */
export const programFormSchema = z
  .object({
    name: z.string().trim().min(1, 'Ponle un nombre al programa'),
    profile: z.union([z.literal(''), z.enum(PROGRAM_PROFILES)]),
    startDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Indica la fecha de inicio'),
    routines: z.array(routineSchema).min(1),
  })
  .superRefine((program, ctx) => {
    // A day can belong to only one routine
    const seen = new Set<Weekday>();
    program.routines.forEach((routine, index) => {
      const repeated = routine.daysOfWeek.filter((day) => seen.has(day));
      routine.daysOfWeek.forEach((day) => seen.add(day));
      if (repeated.length > 0) {
        ctx.addIssue({
          code: 'custom',
          path: ['routines', index, 'daysOfWeek'],
          message: `${repeated.map((d) => weekdayLong[d]).join(', ')} ya está en otra rutina`,
        });
      }
    });
  });

export type ProgramFormValues = z.infer<typeof programFormSchema>;
export type RoutineValues = ProgramFormValues['routines'][number];
export type LineValues = RoutineValues['exercises'][number];

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

/** Suggested days for a new routine (A: L X V, B: M J), skipping days already taken */
export function emptyRoutine(
  index: number,
  takenDays: Weekday[],
): RoutineValues {
  const suggested: Weekday[] =
    index === 0 ? ['MONDAY', 'WEDNESDAY', 'FRIDAY'] : ['TUESDAY', 'THURSDAY'];
  return {
    name: routineName(index),
    daysOfWeek: suggested.filter((day) => !takenDays.includes(day)),
    exercises: [emptyLine],
  };
}

/** Copy of a routine (without database ids) with a new name and no days yet */
export function duplicateRoutine(
  routine: RoutineValues,
  index: number,
): RoutineValues {
  return {
    name: routineName(index),
    daysOfWeek: [],
    exercises: routine.exercises.map((line) => ({ ...line, id: undefined })),
  };
}

export function emptyProgramForm(): ProgramFormValues {
  return {
    name: '',
    profile: '',
    startDate: new Date().toISOString().slice(0, 10),
    routines: [emptyRoutine(0, [])],
  };
}

/** Fills the builder with an existing program (edit mode) */
export function toProgramFormValues(program: Program): ProgramFormValues {
  return {
    name: program.name,
    profile: program.profile ?? '',
    startDate: program.startDate.slice(0, 10),
    routines: program.routines.map((routine) => ({
      id: routine.id,
      name: routine.name,
      daysOfWeek: routine.daysOfWeek,
      exercises: routine.exercises.map((line) => ({
        id: line.id,
        exerciseId: line.exerciseId,
        sets: String(line.sets),
        mode: line.reps !== null ? 'reps' : 'time',
        amount: String(line.reps ?? line.durationSec ?? ''),
        restSec: String(line.restSec),
        targetEffort:
          line.targetEffortPct === null ? '' : String(line.targetEffortPct),
        notes: line.notes ?? '',
      })),
    })),
  };
}

/** Converts form values into the API body */
export function toSaveProgramInput(
  values: ProgramFormValues,
): SaveProgramInput {
  return {
    name: values.name.trim(),
    profile: values.profile || null,
    startDate: values.startDate,
    routines: values.routines.map((routine) => ({
      id: routine.id,
      name: routine.name.trim(),
      daysOfWeek: routine.daysOfWeek,
      exercises: routine.exercises.map((line) => ({
        id: line.id,
        exerciseId: line.exerciseId,
        sets: Number(line.sets),
        reps: line.mode === 'reps' ? Number(line.amount) : null,
        durationSec: line.mode === 'time' ? Number(line.amount) : null,
        restSec: Number(line.restSec),
        targetEffortPct: line.targetEffort ? Number(line.targetEffort) : null,
        notes: line.notes.trim() || null,
      })),
    })),
  };
}
