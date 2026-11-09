import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type UniqueIdentifier,
} from '@dnd-kit/core';
import {
  restrictToParentElement,
  restrictToVerticalAxis,
} from '@dnd-kit/modifiers';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState, type ReactNode } from 'react';
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
import { cn } from '@/lib/utils';
import { DayPicker } from './DayPicker';
import { toLineValues, type LineValues } from './exercise-line.schema';
import { ExerciseLineDialog } from './ExerciseLineDialog';
import type { ProgramFormValues, RoutineValues } from './program-form.schema';
import { formatDuration } from './programs.labels';

interface RoutineFieldsProps {
  index: number;
  control: Control<ProgramFormValues>;
  register: UseFormRegister<ProgramFormValues>;
  setValue: UseFormSetValue<ProgramFormValues>;
  errors?: FieldErrors<RoutineValues>;
  exercises: Exercise[]; // the library, to choose from
}

/** Form text → number for the table, or null if it isn't a valid number */
function numberOrNull(text: string): number | null {
  const n = Number(text);
  return text.trim() !== '' && Number.isFinite(n) ? n : null;
}

/** "10 reps" or "2 min" */
function formatAmount(line: LineValues): string {
  const n = numberOrNull(line.amount);
  if (n === null) return '—';
  return line.mode === 'reps' ? `${n} reps` : formatDuration(n);
}

/** "50 % (5/10)": the percentage and the 0–10 scale the patient answers in the app */
function formatTargetEffort(text: string): string {
  const pct = numberOrNull(text);
  return pct === null ? '—' : `${pct} % (${pct / 10}/10)`;
}

/** Which exercise the dialog is showing: a new one, or the line at `index` */
type DialogTarget = { kind: 'new' } | { kind: 'edit'; index: number } | null;

/**
 * One routine: its name, its days and its exercises (which can come from a template).
 * Exercises are a ruled table: rows are reordered by dragging the handle (mouse, touch or
 * keyboard) and added or edited in a dialog.
 */
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
  const [dialog, setDialog] = useState<DialogTarget>(null);

  const profile = useWatch({ control, name: 'profile' });
  const routine = useWatch({ control, name: `routines.${index}` });
  const hasChosenExercises = routine.exercises.some((l) => l.exerciseId);
  const exerciseName = (id: string) =>
    exercises.find((e) => e.id === id)?.name ?? '—';

  const sensors = useSensors(
    // A few pixels of movement before dragging starts, so a tap on the handle isn't a drag
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const positionOf = (id: UniqueIdentifier) =>
    fields.findIndex((f) => f.fieldKey === id) + 1;

  function handleDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    move(positionOf(active.id) - 1, positionOf(over.id) - 1);
  }

  // What screen readers say while moving a row (dnd-kit's defaults are in English)
  const announcements: Announcements = {
    onDragStart: ({ active }) =>
      `Ejercicio ${positionOf(active.id)} cogido.`,
    onDragOver: ({ over }) =>
      over ? `Sobre la posición ${positionOf(over.id)}.` : undefined,
    onDragEnd: ({ over }) =>
      over ? `Soltado en la posición ${positionOf(over.id)}.` : 'Soltado.',
    onDragCancel: () => 'Movimiento cancelado.',
  };

  function saveLine(line: LineValues) {
    if (dialog?.kind === 'edit') {
      // Keep the database id, so saving the program updates this line instead of recreating it
      update(dialog.index, { ...line, id: routine.exercises[dialog.index].id });
    } else {
      append(line);
    }
  }

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

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        modifiers={[restrictToVerticalAxis, restrictToParentElement]}
        onDragEnd={handleDragEnd}
        accessibility={{
          announcements,
          screenReaderInstructions: {
            draggable:
              'Para mover el ejercicio, pulse espacio, use las flechas arriba y abajo y pulse espacio otra vez para soltarlo. Escape cancela.',
          },
        }}
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[44rem] border-collapse text-[15px]">
            <thead>
              <tr className="border-b-2 border-foreground text-left text-sm text-muted-foreground">
                <th className="w-12 px-1 py-2.5">
                  <span className="sr-only">Orden</span>
                </th>
                <th className="px-3 py-2.5 font-semibold">Ejercicio</th>
                <th className="px-3 py-2.5 font-semibold">Series</th>
                <th className="px-3 py-2.5 font-semibold">Reps / tiempo</th>
                <th className="px-3 py-2.5 font-semibold">Descanso</th>
                <th className="px-3 py-2.5 font-semibold">Esfuerzo objetivo</th>
                <th className="px-3 py-2.5">
                  <span className="sr-only">Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody>
              <SortableContext
                items={fields.map((f) => f.fieldKey)}
                strategy={verticalListSortingStrategy}
              >
                {fields.map((field, lineIndex) => {
                  const line = routine.exercises[lineIndex];
                  if (!line) return null;
                  const name = exerciseName(line.exerciseId);
                  const rest = numberOrNull(line.restSec);
                  return (
                    <SortableRow
                      key={field.fieldKey}
                      id={field.fieldKey}
                      label={name}
                    >
                      <td className="px-3 py-3">
                        <span className="font-semibold">{name}</span>
                        {errors?.exercises?.[lineIndex] && (
                          <span className="block text-sm text-destructive">
                            Revise este ejercicio
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3">{line.sets}</td>
                      <td className="px-3 py-3">{formatAmount(line)}</td>
                      <td className="px-3 py-3">
                        {rest === null ? '—' : formatDuration(rest)}
                      </td>
                      <td className="px-3 py-3">
                        {formatTargetEffort(line.targetEffort)}
                      </td>
                      <td className="px-2 py-1">
                        <div className="flex justify-end gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() =>
                              setDialog({ kind: 'edit', index: lineIndex })
                            }
                          >
                            <Pencil />
                            Editar
                            <span className="sr-only">{name}</span>
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-lg"
                            aria-label={`Quitar ${name}`}
                            title="Quitar ejercicio"
                            onClick={() => remove(lineIndex)}
                          >
                            <Trash2 />
                          </Button>
                        </div>
                      </td>
                    </SortableRow>
                  );
                })}
              </SortableContext>
              {fields.length === 0 && (
                <tr className="border-b">
                  <td
                    colSpan={7}
                    className="px-3 py-6 text-center text-muted-foreground"
                  >
                    Aún no hay ejercicios. Añada uno o cargue una plantilla.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </DndContext>

      <FieldError errors={[listError]} />
      <Button
        type="button"
        variant="ghost"
        className="self-start px-0 text-primary"
        onClick={() => setDialog({ kind: 'new' })}
      >
        <Plus />
        Añadir ejercicio
      </Button>

      <ExerciseLineDialog
        open={dialog !== null}
        onOpenChange={(open) => !open && setDialog(null)}
        line={
          dialog?.kind === 'edit' ? routine.exercises[dialog.index] : undefined
        }
        exercises={exercises}
        onSave={saveLine}
      />
    </div>
  );
}

/** A table row that can be dragged by its handle (first cell) */
function SortableRow({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  return (
    <tr
      ref={setNodeRef}
      // Translate only: scaling a table row distorts it
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn(
        'border-b bg-background',
        isDragging && 'relative z-10 bg-card shadow-md',
      )}
    >
      <td className="px-1 py-1">
        <button
          type="button"
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          aria-label={`Mover ${label}`}
          title="Arrastre para cambiar el orden"
          className={cn(
            'flex size-10 touch-none items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none',
            isDragging ? 'cursor-grabbing' : 'cursor-grab',
          )}
        >
          <GripVertical className="size-5" />
        </button>
      </td>
      {children}
    </tr>
  );
}
