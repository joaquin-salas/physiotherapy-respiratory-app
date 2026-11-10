import { ChevronLeft } from 'lucide-react';
import { Link } from 'react-router';

/** "‹ Ejercicios" link at the top of the exercise pages (same look as the patient wizard's). */
export function BackToExercises() {
  return (
    <Link
      to="/exercises"
      className="mb-3.5 inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
    >
      <ChevronLeft className="size-4" />
      Ejercicios
    </Link>
  );
}
