import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { Routine } from './programs.api';
import {
  formatDays,
  formatDuration,
  formatEffort,
  formatPrescription,
} from './programs.labels';

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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8">#</TableHead>
                <TableHead>Ejercicio</TableHead>
                <TableHead>Pauta</TableHead>
                <TableHead>Esfuerzo</TableHead>
                <TableHead>Descanso</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {routine.exercises.map((line) => (
                <TableRow key={line.id}>
                  <TableCell className="text-muted-foreground">
                    {line.order}
                  </TableCell>
                  <TableCell>
                    <p className="font-medium">{line.exercise.name}</p>
                    {line.notes && (
                      <p className="max-w-sm text-muted-foreground">
                        {line.notes}
                      </p>
                    )}
                  </TableCell>
                  <TableCell>{formatPrescription(line)}</TableCell>
                  <TableCell>{formatEffort(line.targetEffortPct)}</TableCell>
                  <TableCell>{formatDuration(line.restSec)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ))}
    </div>
  );
}
