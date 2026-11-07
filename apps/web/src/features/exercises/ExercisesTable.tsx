import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { Exercise } from './exercises.api';
import { goalLabels } from './exercises.labels';

/** Displays a list of exercises. It only shows data: loading/fetching happens in the page. */
export function ExercisesTable({ exercises }: { exercises: Exercise[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nombre</TableHead>
          <TableHead>Objetivo</TableHead>
          <TableHead className="text-center">Nivel</TableHead>
          <TableHead>Material</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {exercises.map((exercise) => (
          <TableRow key={exercise.id}>
            <TableCell>
              <p className="font-medium">{exercise.name}</p>
              <p className="max-w-md truncate text-muted-foreground">
                {exercise.description}
              </p>
            </TableCell>
            <TableCell>
              <Badge variant="secondary">{goalLabels[exercise.goal]}</Badge>
            </TableCell>
            <TableCell className="text-center">{exercise.level}</TableCell>
            <TableCell>
              {exercise.equipment.length > 0 ? (
                exercise.equipment.join(', ')
              ) : (
                <span className="text-muted-foreground">Sin material</span>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
