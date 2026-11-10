import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { RoutineExercise } from './programs.api';
import {
  formatDuration,
  formatEffort,
  formatPrescription,
} from './programs.labels';

/** Read-only table of a routine's exercises in session order (a program's routine or a template) */
export function ExerciseLinesView({ lines }: { lines: RoutineExercise[] }) {
  return (
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
        {lines.map((line) => (
          <TableRow key={line.id}>
            <TableCell className="text-muted-foreground">{line.order}</TableCell>
            <TableCell>
              <p className="font-medium">{line.exercise.name}</p>
              {line.notes && (
                <p className="max-w-sm text-muted-foreground">{line.notes}</p>
              )}
            </TableCell>
            <TableCell>{formatPrescription(line)}</TableCell>
            <TableCell>{formatEffort(line.targetEffortPct)}</TableCell>
            <TableCell>{formatDuration(line.restSec)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
