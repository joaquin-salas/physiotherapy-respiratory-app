import { Link, useNavigate } from 'react-router';
import { BottomBar } from '@/components/bottom-bar';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { BackToExercises } from './BackToExercises';
import type { ExerciseInput } from './exercises.api';
import { useCreateExercise } from './exercises.hooks';
import { ExerciseForm } from './ExerciseForm';

/** Full page to add an exercise to the library. After saving it opens the new exercise. */
export function NewExercisePage() {
  const navigate = useNavigate();
  const createExercise = useCreateExercise();

  async function save(input: ExerciseInput) {
    const created = await createExercise.mutateAsync(input);
    // replace: "back" from the detail goes to the list, not to an empty form
    await navigate(`/exercises/${created.id}`, { replace: true });
  }

  return (
    // pb-24 leaves room for the bottom bar, which covers the end of the page
    <div className="pb-24">
      <BackToExercises />
      <PageHeader
        title="Nuevo ejercicio"
        description="Añade un ejercicio a la biblioteca para poder asignarlo a los pacientes."
      />

      <ExerciseForm id="new-exercise-form" onSubmit={save} />

      <BottomBar>
        <Button variant="ghost" className="h-11 px-4" asChild>
          <Link to="/exercises">Cancelar</Link>
        </Button>
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-sm text-muted-foreground">
            Los campos con * son obligatorios.
          </span>
          <Button
            type="submit"
            form="new-exercise-form"
            className="h-11 px-4"
            disabled={createExercise.isPending}
          >
            {createExercise.isPending ? 'Guardando…' : 'Crear ejercicio'}
          </Button>
        </div>
      </BottomBar>
    </div>
  );
}
