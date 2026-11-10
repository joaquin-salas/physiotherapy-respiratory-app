import type { Routine } from './programs.api';
import { ExerciseLinesView } from './ExerciseLinesView';
import { formatDays } from './programs.labels';

/** Read-only view of a program's routines: each with its days and its exercises in order */
export function RoutinesView({ routines }: { routines: Routine[] }) {
  return (
    <div className="flex flex-col gap-5">
      {routines.map((routine) => (
        <div key={routine.id} className="flex flex-col gap-1">
          <p className="text-sm font-medium">
            {routine.name}
            <span className="ml-2 font-mono tracking-wider text-muted-foreground">
              {formatDays(routine.daysOfWeek)}
            </span>
            {routine.template && (
              <span className="ml-2 font-normal text-muted-foreground">
                · basada en «{routine.template.name}»
              </span>
            )}
          </p>
          <ExerciseLinesView lines={routine.exercises} />
        </div>
      ))}
    </div>
  );
}
