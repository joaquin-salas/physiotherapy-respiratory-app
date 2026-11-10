import { z } from 'zod';
import {
  EXERCISE_GOALS,
  type Exercise,
  type ExerciseInput,
} from './exercises.api';

/**
 * Validation rules for the exercise form (shown instantly in the browser).
 * The API validates again: browser checks are for convenience, not security.
 */
export const exerciseFormSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es obligatorio'),
  description: z.string().trim().min(1, 'La descripción es obligatoria'),
  goal: z.enum(EXERCISE_GOALS, { error: 'Elige un objetivo' }),
  // Kept as text for NumberInput (an empty field stays empty), converted when sending
  level: z
    .string()
    .refine((text) => /^\d+$/.test(text) && +text >= 1 && +text <= 10, {
      error: 'Indica un nivel del 1 al 10',
    }),
  equipment: z.string(), // comma-separated in the form, e.g. "silla, banda elástica"
  videoUrl: z.union([z.literal(''), z.url('Debe ser una URL válida')]),
  contraindications: z.string(),
});

export type ExerciseFormValues = z.infer<typeof exerciseFormSchema>;

export const emptyExerciseForm: Partial<ExerciseFormValues> = {
  name: '',
  description: '',
  goal: undefined,
  level: '1',
  equipment: '',
  videoUrl: '',
  contraindications: '',
};

/** Fills the form with an existing exercise (for editing). */
export function toExerciseFormValues(exercise: Exercise): ExerciseFormValues {
  return {
    name: exercise.name,
    description: exercise.description,
    goal: exercise.goal,
    level: String(exercise.level),
    equipment: exercise.equipment.join(', '),
    videoUrl: exercise.videoUrl ?? '',
    contraindications: exercise.contraindications ?? '',
  };
}

/** Converts form values into the body the API expects (empty optional fields become null, which clears them). */
export function toExerciseInput(values: ExerciseFormValues): ExerciseInput {
  const equipment = values.equipment
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  return {
    name: values.name,
    description: values.description,
    goal: values.goal,
    level: Number(values.level),
    equipment,
    videoUrl: values.videoUrl || null,
    contraindications: values.contraindications.trim() || null,
  };
}
