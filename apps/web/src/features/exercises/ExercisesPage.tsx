import { CreateExerciseDialog } from './CreateExerciseDialog';
import { useExercises } from './exercises.hooks';
import { ExercisesTable } from './ExercisesTable';

/** Exercise library: list of exercises + button to create a new one. */
export function ExercisesPage() {
  const { data: exercises, isPending, isError, error, refetch } = useExercises();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Ejercicios</h1>
          <p className="text-muted-foreground">
            Biblioteca de ejercicios para asignar a los pacientes.
          </p>
        </div>
        <CreateExerciseDialog />
      </div>

      {isPending ? (
        <p className="text-muted-foreground">Cargando ejercicios…</p>
      ) : isError ? (
        <div className="rounded-md border border-destructive/50 p-4 text-destructive">
          <p>No se pudieron cargar los ejercicios: {error.message}</p>
          <button className="mt-2 underline" onClick={() => refetch()}>
            Reintentar
          </button>
        </div>
      ) : exercises.length === 0 ? (
        <p className="text-muted-foreground">
          Todavía no hay ejercicios. Crea el primero con «Nuevo ejercicio».
        </p>
      ) : (
        <ExercisesTable exercises={exercises} />
      )}
    </div>
  );
}
