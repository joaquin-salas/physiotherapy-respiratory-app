import {
  Controller,
  useFieldArray,
  useWatch,
  type Control,
  type FieldErrors,
  type UseFormRegister,
  type UseFormSetValue,
} from 'react-hook-form';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import type { Exercise } from '@/features/exercises/exercises.api';
import type { RoutineTemplate } from '@/features/routine-templates/routine-templates.api';
import { LoadTemplateDialog } from '@/features/routine-templates/LoadTemplateDialog';
import { DayPicker } from './DayPicker';
import { toLineValues } from './exercise-line.schema';
import { ExerciseLinesEditor } from './ExerciseLinesEditor';
import type { ProgramFormValues, RoutineValues } from './program-form.schema';

interface RoutineFieldsProps {
  index: number;
  control: Control<ProgramFormValues>;
  register: UseFormRegister<ProgramFormValues>;
  setValue: UseFormSetValue<ProgramFormValues>;
  errors?: FieldErrors<RoutineValues>;
  exercises: Exercise[]; // the library, to choose from
}

/** One routine: its name, its days and its exercises (which can come from a template). */
export function RoutineFields({
  index,
  control,
  register,
  setValue,
  errors,
  exercises,
}: RoutineFieldsProps) {
  // keyName: our lines already have an `id` field (the database id), so the
  // internal React key must use a different name
  const { fields, append, remove, move, replace, update } = useFieldArray({
    control,
    name: `routines.${index}.exercises`,
    keyName: 'fieldKey',
  });

  const profile = useWatch({ control, name: 'profile' });
  const routine = useWatch({ control, name: `routines.${index}` });
  const hasChosenExercises = routine.exercises.some((l) => l.exerciseId);


  /** Copies the template's exercises into this routine (as new lines) and remembers the source */
  function loadTemplate(template: RoutineTemplate) {
    replace(template.exercises.map((line) => toLineValues(line, false)));
    setValue(`routines.${index}.templateId`, template.id);
    setValue(`routines.${index}.templateName`, template.name);
    // Keep a name the physio typed; replace the default "Rutina A"
    if (/^Rutina [A-Z]$/.test(routine.name.trim()) || !routine.name.trim()) {
      setValue(`routines.${index}.name`, template.name);
    }
  }

  const listError = errors?.exercises?.root ?? errors?.exercises;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-wrap gap-4">
          <Field data-invalid={!!errors?.name} className="w-56">
            <FieldLabel htmlFor={`routine-${index}-name`}>
              Nombre de la rutina
            </FieldLabel>
            <Input
              id={`routine-${index}-name`}
              aria-invalid={!!errors?.name}
              {...register(`routines.${index}.name`)}
            />
            <FieldError errors={[errors?.name]} />
          </Field>

          <Field data-invalid={!!errors?.daysOfWeek} className="w-auto">
            <FieldLabel>Días</FieldLabel>
            <Controller
              name={`routines.${index}.daysOfWeek`}
              control={control}
              render={({ field }) => (
                <DayPicker
                  value={field.value}
                  onChange={field.onChange}
                  invalid={!!errors?.daysOfWeek}
                />
              )}
            />
            <FieldError errors={[errors?.daysOfWeek]} />
          </Field>
        </div>

        <div className="self-end">
          <LoadTemplateDialog
            profile={profile || null}
            willReplace={hasChosenExercises}
            onLoad={loadTemplate}
          />
        </div>
      </div>

      {routine.templateName && (
        <p className="text-sm text-muted-foreground">
          Plantilla cargada:{' '}
          <strong className="text-foreground">{routine.templateName}</strong>.
          Puede ajustar cada línea.
        </p>
      )}

      <ExerciseLinesEditor
        fieldKeys={fields.map((f) => f.fieldKey)}
        lines={routine.exercises}
        exercises={exercises}
        emptyText="Aún no hay ejercicios. Añada uno o cargue una plantilla."
        isLineInvalid={(lineIndex) => !!errors?.exercises?.[lineIndex]}
        listError={listError}
        onAdd={append}
        onEdit={(lineIndex, line) =>
          // Keep the database id, so saving the program updates this line instead of recreating it
          update(lineIndex, { ...line, id: routine.exercises[lineIndex].id })
        }
        onRemove={remove}
        onMove={move}
      />
    </div>
  );
}
