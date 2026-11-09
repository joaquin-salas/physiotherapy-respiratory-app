import { Pencil, Plus } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useExercises } from '@/features/exercises/exercises.hooks';
import type { Program, SaveProgramInput } from './programs.api';
import { useCreateProgram, useUpdateProgram } from './programs.hooks';
import { ProgramForm } from './ProgramForm';

type ProgramBuilderDialogProps =
  | { patientId: string; program?: undefined } // create
  | { program: Program; patientId?: undefined }; // edit

/**
 * Button + dialog with the program builder (patient record).
 * With `patientId` it assigns a new program; with `program` it edits that one.
 */
export function ProgramBuilderDialog(props: ProgramBuilderDialogProps) {
  const { program } = props;
  const isEdit = !!program;
  const [open, setOpen] = useState(false);

  const { data: library = [] } = useExercises();
  const createProgram = useCreateProgram(props.patientId ?? '');
  const updateProgram = useUpdateProgram(program?.id ?? '');
  const isSaving = createProgram.isPending || updateProgram.isPending;

  async function save(input: SaveProgramInput) {
    if (isEdit) await updateProgram.mutateAsync(input);
    else await createProgram.mutateAsync(input);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {isEdit ? (
          <Button variant="outline">
            <Pencil />
            Editar programa
          </Button>
        ) : (
          <Button>
            <Plus />
            Asignar programa
          </Button>
        )}
      </DialogTrigger>

      {/* The content unmounts when closed, so every opening starts from the saved data */}
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Editar programa' : 'Nuevo programa'}
          </DialogTitle>
          <DialogDescription>
            Un programa tiene una o dos rutinas. Cada rutina se repite los días
            que elijas; los demás días son de descanso.
          </DialogDescription>
        </DialogHeader>

        <ProgramForm id="program-form" program={program} onSubmit={save} />

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form="program-form"
            disabled={isSaving || library.length === 0}
          >
            {isSaving ? 'Guardando…' : 'Guardar programa'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
