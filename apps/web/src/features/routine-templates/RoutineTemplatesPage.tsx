import { Plus } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  PROGRAM_PROFILES,
  type ProgramProfile,
} from '@/features/programs/programs.api';
import { profileLabels } from '@/features/programs/programs.labels';
import { useRoutineTemplates } from './routine-templates.hooks';

const ALL = 'all';

/** Shared library of routine templates, filterable by profile. Each row opens its template. */
export function RoutineTemplatesPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<ProgramProfile | typeof ALL>(ALL);
  const {
    data: templates,
    isPending,
    isError,
    refetch,
  } = useRoutineTemplates(filter === ALL ? undefined : filter);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Plantillas de rutina"
        description="Rutinas preestablecidas que cualquier fisioterapeuta puede cargar en un programa."
        actions={
          <Button className="h-11 px-4" asChild>
            <Link to="/templates/new">
              <Plus />
              Nueva plantilla
            </Link>
          </Button>
        }
      />

      <Tabs
        value={filter}
        onValueChange={(value) => setFilter(value as typeof filter)}
      >
        <TabsList>
          <TabsTrigger value={ALL}>Todas</TabsTrigger>
          {PROGRAM_PROFILES.map((profile) => (
            <TabsTrigger key={profile} value={profile}>
              {profileLabels[profile]}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {isPending ? (
        <p className="text-muted-foreground">Cargando plantillas…</p>
      ) : isError ? (
        <div className="rounded-md border border-destructive/50 p-4 text-destructive">
          <p>No se pudieron cargar las plantillas.</p>
          <button className="mt-2 underline" onClick={() => refetch()}>
            Reintentar
          </button>
        </div>
      ) : templates.length === 0 ? (
        <p className="text-muted-foreground">
          {filter === ALL
            ? 'Todavía no hay plantillas. Crea la primera con «Nueva plantilla».'
            : 'No hay plantillas para este perfil.'}
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Perfil</TableHead>
              <TableHead>Ejercicios</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {templates.map((template) => (
              <TableRow
                key={template.id}
                className="cursor-pointer"
                onClick={() => navigate(`/templates/${template.id}`)}
              >
                <TableCell>
                  {/* A real link (keyboard, middle-click); the row click is a shortcut */}
                  <Link
                    to={`/templates/${template.id}`}
                    className="font-medium hover:underline"
                    onClick={(event) => event.stopPropagation()}
                  >
                    {template.name}
                  </Link>
                  {template.description && (
                    <p className="max-w-md truncate text-muted-foreground">
                      {template.description}
                    </p>
                  )}
                </TableCell>
                <TableCell>
                  {template.profile ? (
                    <Badge variant="secondary">
                      {profileLabels[template.profile]}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">Cualquiera</span>
                  )}
                </TableCell>
                <TableCell className="max-w-sm truncate">
                  {template.exercises.map((l) => l.exercise.name).join(', ')}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
