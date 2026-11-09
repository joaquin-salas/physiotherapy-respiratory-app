import { z } from 'zod';
import {
  lineSchema,
  toLineInput,
  toLineValues,
} from './exercise-line.schema';
import {
  PROGRAM_PROFILES,
  WEEKDAYS,
  type Program,
  type SaveProgramInput,
  type Weekday,
} from './programs.api';
import { routineName, weekdayLong } from './programs.labels';

const routineSchema = z.object({
  id: z.string().optional(), // existing routine (edit mode)
  templateId: z.string().optional(), // set when loaded from a template
  templateName: z.string().optional(), // only for display ("Basada en…"), not sent
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
    exercises: [], // added from the table's dialog or a template
  };
}

/** Copy of a routine (without database ids) with a new name and no days yet */
export function duplicateRoutine(
  routine: RoutineValues,
  index: number,
): RoutineValues {
  return {
    templateId: routine.templateId,
    templateName: routine.templateName,
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
      templateId: routine.templateId ?? undefined,
      templateName: routine.template?.name,
      name: routine.name,
      daysOfWeek: routine.daysOfWeek,
      exercises: routine.exercises.map((line) => toLineValues(line, true)),
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
      templateId: routine.templateId ?? null,
      name: routine.name.trim(),
      daysOfWeek: routine.daysOfWeek,
      exercises: routine.exercises.map(toLineInput),
    })),
  };
}
