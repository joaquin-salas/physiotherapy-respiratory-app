import { Plus } from 'lucide-react';
import {
  Controller,
  useFieldArray,
  useWatch,
  type Control,
  type FieldErrors,
  type UseFormRegister,
  type UseFormSetValue,
} from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import type { Exercise } from '@/features/exercises/exercises.api';
import type { RoutineTemplate } from '@/features/routine-templates/routine-templates.api';
import { LoadTemplateDialog } from '@/features/routine-templates/LoadTemplateDialog';
import { DayPicker } from './DayPicker';
import { emptyLine, toLineValues } from './exercise-line.schema';
import { ExerciseLineFields } from './ExerciseLineFields';
import type { ProgramFormValues, RoutineValues } from './program-form.schema';

interface RoutineFieldsProps {
  index: number;
  control: Control<ProgramFormValues>;
  register: UseFormRegister<ProgramFormValues>;
  setValue: UseFormSetValue<ProgramFormValues>;
  errors?: FieldErrors<RoutineValues>;
  exercises: Exercise[]; // the library, to choose from
}

/** One routine: its name, its days and its list of exercises (which can come from a template) */
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
  const { fields, append, remove, move, replace } = useFieldArray({
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
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
        <Field data-invalid={!!errors?.name}>
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

        <Field data-invalid={!!errors?.daysOfWeek}>
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

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {routine.templateName
            ? `Basada en la plantilla «${routine.templateName}»`
            : 'Ejercicios en el orden en que se hacen'}
        </p>
        <LoadTemplateDialog
          profile={profile || null}
          willReplace={hasChosenExercises}
          onLoad={loadTemplate}
        />
      </div>

      <div className="flex flex-col gap-3">
        {fields.map((field, lineIndex) => (
          <ExerciseLineFields
            key={field.fieldKey}
            basePath={`routines.${index}.exercises.${lineIndex}`}
            index={lineIndex}
            total={fields.length}
            control={control}
            register={register}
            errors={errors?.exercises?.[lineIndex]}
            exercises={exercises}
            onMove={(to) => move(lineIndex, to)}
            onRemove={() => remove(lineIndex)}
          />
        ))}
        <FieldError errors={[listError]} />
        <Button
          type="button"
          variant="outline"
          className="self-start"
          onClick={() => append(emptyLine)}
        >
          <Plus />
          Añadir ejercicio
        </Button>
      </div>
    </div>
  );
}
