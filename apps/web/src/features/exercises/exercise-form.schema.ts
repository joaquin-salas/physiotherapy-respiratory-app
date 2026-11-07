import { z } from 'zod';
import { EXERCISE_GOALS, type CreateExerciseInput } from './exercises.api';

/**
 * Validation rules for the create form (shown instantly in the browser).
 * The API validates again: browser checks are for convenience, not security.
 */
export const exerciseFormSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es obligatorio'),
  description: z.string().trim().min(1, 'La descripción es obligatoria'),
  goal: z.enum(EXERCISE_GOALS, { error: 'Elige un objetivo' }),
  level: z
    .number({ error: 'Indica un nivel' })
    .int('Debe ser un número entero')
    .min(1, 'Mínimo 1')
    .max(10, 'Máximo 10'),
  equipment: z.string(), // comma-separated in the form, e.g. "silla, banda elástica"
  videoUrl: z.union([z.literal(''), z.url('Debe ser una URL válida')]),
  contraindications: z.string(),
});

export type ExerciseFormValues = z.infer<typeof exerciseFormSchema>;

export const emptyExerciseForm: Partial<ExerciseFormValues> = {
  name: '',
  description: '',
  goal: undefined,
  level: 1,
  equipment: '',
  videoUrl: '',
  contraindications: '',
};

/** Converts form values into the body the API expects (empty optional fields are left out). */
export function toCreateExerciseInput(
  values: ExerciseFormValues,
): CreateExerciseInput {
  const equipment = values.equipment
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  return {
    name: values.name,
    description: values.description,
    goal: values.goal,
    level: values.level,
    equipment,
    videoUrl: values.videoUrl || undefined,
    contraindications: values.contraindications.trim() || undefined,
  };
}
