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
import { Button } from '@/components/ui/button';
import { FieldError } from '@/components/ui/field';
import type { Exercise } from '@/features/exercises/exercises.api';
import { cn } from '@/lib/utils';
import type { LineValues } from './exercise-line.schema';
import { ExerciseLineDialog } from './ExerciseLineDialog';
import { formatDuration } from './programs.labels';

interface ExerciseLinesEditorProps {
  /** React keys of the lines, from useFieldArray's `fields` (same order as `lines`) */
  fieldKeys: string[];
  /** Current values of the lines (useWatch) */
  lines: LineValues[];
  exercises: Exercise[]; // the library, to choose from
  /** Text of the empty table */
  emptyText: string;
  /** Marks a row that has validation errors */
  isLineInvalid?: (index: number) => boolean;
  /** Error about the whole list (e.g. "add at least one exercise") */
  listError?: { message?: string };
  onAdd: (line: LineValues) => void;
  onEdit: (index: number, line: LineValues) => void;
  onRemove: (index: number) => void;
  onMove: (from: number, to: number) => void;
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
 * The exercises of a routine (in a program or a template) as a ruled table: rows are reordered
 * by dragging the handle (mouse, touch or keyboard) and added or edited in a dialog.
 * The parent owns the list (useFieldArray) and receives every change through the callbacks.
 */
export function ExerciseLinesEditor({
  fieldKeys,
  lines,
  exercises,
  emptyText,
  isLineInvalid,
  listError,
  onAdd,
  onEdit,
  onRemove,
  onMove,
}: ExerciseLinesEditorProps) {
  const [dialog, setDialog] = useState<DialogTarget>(null);
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
    fieldKeys.indexOf(String(id)) + 1;

  function handleDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    onMove(positionOf(active.id) - 1, positionOf(over.id) - 1);
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
    if (dialog?.kind === 'edit') onEdit(dialog.index, line);
    else onAdd(line);
  }

  return (
    <div className="flex flex-col gap-5">
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
                items={fieldKeys}
                strategy={verticalListSortingStrategy}
              >
                {fieldKeys.map((fieldKey, lineIndex) => {
                  const line = lines[lineIndex];
                  if (!line) return null;
                  const name = exerciseName(line.exerciseId);
                  const rest = numberOrNull(line.restSec);
                  return (
                    <SortableRow
                      key={fieldKey}
                      id={fieldKey}
                      label={name}
                    >
                      <td className="px-3 py-3">
                        <span className="font-semibold">{name}</span>
                        {isLineInvalid?.(lineIndex) && (
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
                            onClick={() => onRemove(lineIndex)}
                          >
                            <Trash2 />
                          </Button>
                        </div>
                      </td>
                    </SortableRow>
                  );
                })}
              </SortableContext>
              {fieldKeys.length === 0 && (
                <tr className="border-b">
                  <td
                    colSpan={7}
                    className="px-3 py-6 text-center text-muted-foreground"
                  >
                    {emptyText}
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
        line={dialog?.kind === 'edit' ? lines[dialog.index] : undefined}
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
