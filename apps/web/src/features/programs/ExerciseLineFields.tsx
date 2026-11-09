import { ArrowDown, ArrowUp, Trash2 } from 'lucide-react';
import {
  Controller,
  useWatch,
  type Control,
  type FieldErrors,
  type FieldValues,
  type Path,
  type UseFormRegister,
} from 'react-hook-form';
import { NumberInput } from '@/components/number-input';
import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Exercise } from '@/features/exercises/exercises.api';
import { cn } from '@/lib/utils';
import { AMOUNT_LIMITS, type LineValues } from './exercise-line.schema';
import { EFFORT_OPTIONS } from './programs.labels';

interface ExerciseLineFieldsProps<T extends FieldValues> {
  /** Where this line lives in the form, e.g. "routines.0.exercises.2" or "exercises.2" */
  basePath: string;
  /** Position and row actions; leave them out when the line is edited on its own (a dialog) */
  index?: number;
  total?: number;
  control: Control<T>;
  register: UseFormRegister<T>;
  errors?: FieldErrors<LineValues>;
  exercises: Exercise[]; // the library, to choose from
  onMove?: (to: number) => void;
  onRemove?: () => void;
}

/** Radix Select doesn't allow an empty value, so "not set" uses this placeholder value */
const NO_EFFORT = 'none';

/**
 * The fields of one exercise line. Used by the program builder and the template editor,
 * so it works with any form: it only needs to know where the line is (`basePath`).
 */
export function ExerciseLineFields<T extends FieldValues>({
  basePath,
  index = 0,
  total = 1,
  control,
  register,
  errors,
  exercises,
  onMove,
  onRemove,
}: ExerciseLineFieldsProps<T>) {
  const p = (field: keyof LineValues) => `${basePath}.${field}` as Path<T>;
  const mode = useWatch({ control, name: p('mode') }) as LineValues['mode'];
  const id = (field: string) => `${basePath.replaceAll('.', '-')}-${field}`;
  const hasRowActions = !!onMove && !!onRemove;

  return (
    <div
      className={cn(
        'flex flex-col gap-4',
        hasRowActions && 'rounded-lg border p-4',
      )}
    >
      <div className="flex items-start gap-2">
        {hasRowActions && (
          <span className="mt-1.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
            {index + 1}
          </span>
        )}

        <Field data-invalid={!!errors?.exerciseId} className="flex-1">
          <FieldLabel
            htmlFor={id('exerciseId')}
            className={hasRowActions ? 'sr-only' : undefined}
          >
            Ejercicio *
          </FieldLabel>
          <Controller
            name={p('exerciseId')}
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger
                  id={id('exerciseId')}
                  className="w-full"
                  aria-invalid={!!errors?.exerciseId}
                >
                  <SelectValue placeholder="Elige un ejercicio" />
                </SelectTrigger>
                <SelectContent>
                  {exercises.map((exercise) => (
                    <SelectItem key={exercise.id} value={exercise.id}>
                      {exercise.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          <FieldError errors={[errors?.exerciseId]} />
        </Field>

        {hasRowActions && (
          <>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Subir"
              title="Subir"
              disabled={index === 0}
              onClick={() => onMove?.(index - 1)}
            >
              <ArrowUp />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Bajar"
              title="Bajar"
              disabled={index === total - 1}
              onClick={() => onMove?.(index + 1)}
            >
              <ArrowDown />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Quitar ejercicio"
              title="Quitar ejercicio"
              disabled={total === 1}
              onClick={onRemove}
            >
              <Trash2 />
            </Button>
          </>
        )}
      </div>

      {/* Series only holds 1–20, so it gets a narrow column and the others more room */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-[5.5rem_repeat(4,minmax(0,1fr))]">
        <Field data-invalid={!!errors?.sets}>
          <FieldLabel htmlFor={id('sets')}>Series</FieldLabel>
          <Controller
            name={p('sets')}
            control={control}
            render={({ field }) => (
              <NumberInput
                id={id('sets')}
                min={1}
                max={20}
                aria-invalid={!!errors?.sets}
                value={field.value as string}
                onChange={field.onChange}
                onBlur={field.onBlur}
                ref={field.ref}
              />
            )}
          />
          <FieldError errors={[errors?.sets]} />
        </Field>

        <Field>
          <FieldLabel htmlFor={id('mode')}>Se mide en</FieldLabel>
          <Controller
            name={p('mode')}
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id={id('mode')} className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="reps">Repeticiones</SelectItem>
                  <SelectItem value="time">Tiempo</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </Field>

        <Field data-invalid={!!errors?.amount}>
          <FieldLabel htmlFor={id('amount')}>
            {mode === 'reps' ? 'Repeticiones' : 'Segundos'}
          </FieldLabel>
          <Controller
            name={p('amount')}
            control={control}
            render={({ field }) => (
              <NumberInput
                id={id('amount')}
                min={AMOUNT_LIMITS[mode].min}
                max={AMOUNT_LIMITS[mode].max}
                step={mode === 'reps' ? 1 : 5}
                aria-invalid={!!errors?.amount}
                value={field.value as string}
                onChange={field.onChange}
                onBlur={field.onBlur}
                ref={field.ref}
              />
            )}
          />
          <FieldError errors={[errors?.amount]} />
        </Field>

        <Field data-invalid={!!errors?.restSec}>
          <FieldLabel htmlFor={id('restSec')}>Descanso (s)</FieldLabel>
          <Controller
            name={p('restSec')}
            control={control}
            render={({ field }) => (
              <NumberInput
                id={id('restSec')}
                min={0}
                max={600}
                step={5}
                aria-invalid={!!errors?.restSec}
                value={field.value as string}
                onChange={field.onChange}
                onBlur={field.onBlur}
                ref={field.ref}
              />
            )}
          />
          <FieldError errors={[errors?.restSec]} />
        </Field>

        <Field>
          <FieldLabel htmlFor={id('targetEffort')}>Esfuerzo</FieldLabel>
          <Controller
            name={p('targetEffort')}
            control={control}
            render={({ field }) => (
              <Select
                value={field.value || NO_EFFORT}
                onValueChange={(value) =>
                  field.onChange(value === NO_EFFORT ? '' : value)
                }
              >
                <SelectTrigger id={id('targetEffort')} className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_EFFORT}>Sin indicar</SelectItem>
                  {EFFORT_OPTIONS.map((pct) => (
                    <SelectItem key={pct} value={String(pct)}>
                      {pct} %
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </Field>
      </div>

      <Field>
        <FieldLabel htmlFor={id('notes')}>Indicaciones (opcional)</FieldLabel>
        <Input
          id={id('notes')}
          placeholder="Ej.: parar si nota mucho ahogo"
          {...register(p('notes'))}
        />
      </Field>
    </div>
  );
}
