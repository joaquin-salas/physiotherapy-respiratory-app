import { Pencil, Trash2 } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router';
import { BottomBar } from '@/components/bottom-bar';
import { PageHeader } from '@/components/page-header';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { ApiError } from '@/lib/api-client';
import { BackToExercises } from './BackToExercises';
import type { Exercise, ExerciseInput } from './exercises.api';
import {
  useDeleteExercise,
  useExercise,
  useUpdateExercise,
} from './exercises.hooks';
import { goalLabels } from './exercises.labels';
import { ExerciseForm } from './ExerciseForm';

/** One exercise: its details, with "Editar" (switches the page to the form) and "Eliminar". */
export function ExerciseDetailPage() {
  const { id = '' } = useParams();
  const { data: exercise, isPending, isError, error, refetch } = useExercise(id);

  if (isPending) {
    return <p className="text-muted-foreground">Cargando ejercicio…</p>;
  }

  if (isError) {
    return (
      <div className="flex flex-col gap-4">
        <BackToExercises />
        {error instanceof ApiError && error.status === 404 ? (
          <p>Ejercicio no encontrado.</p>
        ) : (
          <div className="text-destructive">
            <p>No se pudo cargar el ejercicio.</p>
            <button className="mt-2 underline" onClick={() => refetch()}>
              Reintentar
            </button>
          </div>
        )}
      </div>
    );
  }

  return <ExerciseDetail exercise={exercise} />;
}

function ExerciseDetail({ exercise }: { exercise: Exercise }) {
  const [editing, setEditing] = useState(false);
  const updateExercise = useUpdateExercise(exercise.id);

  async function save(input: ExerciseInput) {
    await updateExercise.mutateAsync(input);
    setEditing(false);
  }

  return (
    // In edit mode, pb-24 leaves room for the bottom bar
    <div className={editing ? 'pb-24' : undefined}>
      <BackToExercises />
      <PageHeader
        title={exercise.name}
        description={goalLabels[exercise.goal]}
        actions={
          !editing && (
            <div className="flex gap-2">
              <Button className="h-11 px-4" onClick={() => setEditing(true)}>
                <Pencil />
                Editar
              </Button>
              <DeleteExerciseButton exercise={exercise} />
            </div>
          )
        }
      />

      {editing ? (
        <>
          <p className="mb-8 rounded-md border border-warning/50 bg-warning/10 p-3 text-sm">
            Los cambios se verán en todos los programas y plantillas que usan
            este ejercicio, también en la app de los pacientes.
          </p>

          <ExerciseForm
            id="edit-exercise-form"
            exercise={exercise}
            onSubmit={save}
          />

          <BottomBar>
            <Button
              variant="ghost"
              className="h-11 px-4"
              onClick={() => setEditing(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              form="edit-exercise-form"
              className="h-11 px-4"
              disabled={updateExercise.isPending}
            >
              {updateExercise.isPending ? 'Guardando…' : 'Guardar cambios'}
            </Button>
          </BottomBar>
        </>
      ) : (
        <dl>
          <InfoRow label="Descripción">
            <span className="whitespace-pre-line">{exercise.description}</span>
          </InfoRow>
          <InfoRow label="Objetivo">{goalLabels[exercise.goal]}</InfoRow>
          <InfoRow label="Nivel">{exercise.level}</InfoRow>
          <InfoRow label="Material">
            {exercise.equipment.length > 0
              ? exercise.equipment.join(', ')
              : 'Sin material'}
          </InfoRow>
          <InfoRow label="Vídeo">
            {exercise.videoUrl && (
              <a
                href={exercise.videoUrl}
                target="_blank"
                rel="noreferrer"
                className="break-all text-primary underline"
              >
                {exercise.videoUrl}
              </a>
            )}
          </InfoRow>
          <InfoRow label="Contraindicaciones">
            {exercise.contraindications && (
              <span className="whitespace-pre-line">
                {exercise.contraindications}
              </span>
            )}
          </InfoRow>
        </dl>
      )}
    </div>
  );
}

/** "Eliminar" with confirmation. The API refuses if the exercise is in use; the reason is shown below. */
function DeleteExerciseButton({ exercise }: { exercise: Exercise }) {
  const navigate = useNavigate();
  const deleteExercise = useDeleteExercise(exercise.id);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function remove() {
    setErrorMessage(null);
    try {
      await deleteExercise.mutateAsync();
      await navigate('/exercises', { replace: true });
    } catch (error) {
      setErrorMessage(
        error instanceof ApiError && error.status === 409
          ? 'No se puede eliminar: se usa en algún programa o plantilla.'
          : 'No se pudo eliminar el ejercicio. Inténtelo de nuevo.',
      );
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="outline"
            className="h-11 px-4"
            disabled={deleteExercise.isPending}
          >
            <Trash2 />
            Eliminar
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar «{exercise.name}»?</AlertDialogTitle>
            <AlertDialogDescription>
              Se borrará de la biblioteca. No se puede deshacer. Si se usa en
              algún programa o plantilla, no se podrá eliminar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={remove}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {errorMessage && (
        <p role="alert" className="max-w-xs text-right text-sm text-destructive">
          {errorMessage}
        </p>
      )}
    </div>
  );
}

/** One "label: value" line, ruled like the panel's tables. Empty values show a dash. */
function InfoRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[10rem_1fr] gap-4 border-b py-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd>{children || '—'}</dd>
    </div>
  );
}
