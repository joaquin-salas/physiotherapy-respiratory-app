import { Link, useNavigate } from 'react-router';
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

/**
 * Displays a list of exercises; clicking a row opens the exercise.
 * The name is a real link (keyboard, middle-click); the row click is a shortcut for the mouse/touch.
 */
export function ExercisesTable({ exercises }: { exercises: Exercise[] }) {
  const navigate = useNavigate();

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
          <TableRow
            key={exercise.id}
            className="cursor-pointer"
            onClick={() => navigate(`/exercises/${exercise.id}`)}
          >
            <TableCell>
              <Link
                to={`/exercises/${exercise.id}`}
                className="font-medium hover:underline"
                onClick={(event) => event.stopPropagation()}
              >
                {exercise.name}
              </Link>
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
