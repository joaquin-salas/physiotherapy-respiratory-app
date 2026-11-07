import { Plus } from 'lucide-react';
import {
  Controller,
  useFieldArray,
  type Control,
  type FieldErrors,
  type UseFormRegister,
} from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import type { Exercise } from '@/features/exercises/exercises.api';
import { DayPicker } from './DayPicker';
import {
  emptyLine,
  type ProgramFormValues,
  type RoutineValues,
} from './program-form.schema';
import { ProgramLineFields } from './ProgramLineFields';

interface RoutineFieldsProps {
  index: number;
  control: Control<ProgramFormValues>;
  register: UseFormRegister<ProgramFormValues>;
  errors?: FieldErrors<RoutineValues>;
  exercises: Exercise[]; // the library, to choose from
}

/** One routine: its name, its days and its list of exercises */
export function RoutineFields({
  index,
  control,
  register,
  errors,
  exercises,
}: RoutineFieldsProps) {
  // keyName: our lines already have an `id` field (the database id), so the
  // internal React key must use a different name
  const { fields, append, remove, move } = useFieldArray({
    control,
    name: `routines.${index}.exercises`,
    keyName: 'fieldKey',
  });

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

      <div className="flex flex-col gap-3">
        {fields.map((field, lineIndex) => (
          <ProgramLineFields
            key={field.fieldKey}
            routineIndex={index}
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
