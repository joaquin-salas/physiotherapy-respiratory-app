import { z } from 'zod';
import {
  lineSchema,
  toLineInput,
  toLineValues,
} from '@/features/programs/exercise-line.schema';
import { PROGRAM_PROFILES } from '@/features/programs/programs.api';
import type {
  RoutineTemplate,
  SaveRoutineTemplateInput,
} from './routine-templates.api';

/** Validation rules for the template editor (exercise lines: same rules as in programs) */
export const templateFormSchema = z.object({
  name: z.string().trim().min(1, 'Ponle un nombre a la plantilla'),
  profile: z.union([z.literal(''), z.enum(PROGRAM_PROFILES)]),
  description: z.string(),
  exercises: z.array(lineSchema).min(1, 'Añade al menos un ejercicio'),
});

export type TemplateFormValues = z.infer<typeof templateFormSchema>;

export function emptyTemplateForm(): TemplateFormValues {
  return { name: '', profile: '', description: '', exercises: [] };
}

export function toTemplateFormValues(
  template: RoutineTemplate,
): TemplateFormValues {
  return {
    name: template.name,
    profile: template.profile ?? '',
    description: template.description ?? '',
    // Template lines are recreated on every save, so their ids aren't needed
    exercises: template.exercises.map((line) => toLineValues(line, false)),
  };
}

export function toSaveTemplateInput(
  values: TemplateFormValues,
): SaveRoutineTemplateInput {
  return {
    name: values.name.trim(),
    profile: values.profile || null,
    description: values.description.trim() || null,
    exercises: values.exercises.map(toLineInput),
  };
}
