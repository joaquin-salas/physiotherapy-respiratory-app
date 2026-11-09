import { zodResolver } from '@hookform/resolvers/zod';
import type { FormEvent } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { Exercise } from '@/features/exercises/exercises.api';
import { emptyLine, lineSchema, type LineValues } from './exercise-line.schema';
import { ExerciseLineFields } from './ExerciseLineFields';

// The line lives under `line` so ExerciseLineFields can address it with basePath "line"
const dialogSchema = z.object({ line: lineSchema });
type DialogValues = z.infer<typeof dialogSchema>;

interface ExerciseLineDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The line to edit; without it the dialog adds a new one */
  line?: LineValues;
  exercises: Exercise[]; // the library, to choose from
  onSave: (line: LineValues) => void;
}

/** Dialog to add or edit one exercise of a routine. Saving only updates the program form, not the server. */
export function ExerciseLineDialog({
  open,
  onOpenChange,
  line,
  exercises,
  onSave,
}: ExerciseLineDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* The content unmounts when closed, so every opening starts from `line` */}
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{line ? 'Editar ejercicio' : 'Añadir ejercicio'}</DialogTitle>
          <DialogDescription>
            Los cambios se guardan al guardar el programa.
          </DialogDescription>
        </DialogHeader>
        <LineForm
          line={line}
          exercises={exercises}
          onSave={(values) => {
            onSave(values);
            onOpenChange(false);
          }}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

function LineForm({
  line,
  exercises,
  onSave,
  onCancel,
}: {
  line?: LineValues;
  exercises: Exercise[];
  onSave: (line: LineValues) => void;
  onCancel: () => void;
}) {
  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DialogValues>({
    resolver: zodResolver(dialogSchema),
    defaultValues: { line: line ?? emptyLine },
  });

  function submit(event: FormEvent<HTMLFormElement>) {
    // The dialog is drawn outside the page, but React still passes the submit event up to the
    // program <form> that contains it in the component tree. Stop it here.
    event.stopPropagation();
    void handleSubmit((values) => onSave(values.line))(event);
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-6">
      <ExerciseLineFields
        basePath="line"
        control={control}
        register={register}
        errors={errors.line}
        exercises={exercises}
      />
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">{line ? 'Guardar cambios' : 'Añadir'}</Button>
      </DialogFooter>
    </form>
  );
}
