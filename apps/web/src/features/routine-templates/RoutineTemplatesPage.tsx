import { Trash2 } from 'lucide-react';
import { useState } from 'react';
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
import type { RoutineTemplate } from './routine-templates.api';
import {
  useDeleteRoutineTemplate,
  useRoutineTemplates,
} from './routine-templates.hooks';
import { RoutineTemplateDialog } from './RoutineTemplateDialog';

const ALL = 'all';

/** Shared library of routine templates, filterable by profile */
export function RoutineTemplatesPage() {
  const [filter, setFilter] = useState<ProgramProfile | typeof ALL>(ALL);
  const {
    data: templates,
    isPending,
    isError,
    refetch,
  } = useRoutineTemplates(filter === ALL ? undefined : filter);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Plantillas de rutina</h1>
          <p className="text-muted-foreground">
            Rutinas preestablecidas que cualquier fisioterapeuta puede cargar en
            un programa.
          </p>
        </div>
        <RoutineTemplateDialog />
      </div>

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
              <TableHead className="w-0" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {templates.map((template) => (
              <TableRow key={template.id}>
                <TableCell>
                  <p className="font-medium">{template.name}</p>
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
                <TableCell>
                  <div className="flex justify-end gap-1">
                    <RoutineTemplateDialog template={template} />
                    <DeleteTemplateButton template={template} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

function DeleteTemplateButton({ template }: { template: RoutineTemplate }) {
  const deleteTemplate = useDeleteRoutineTemplate();

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          disabled={deleteTemplate.isPending}
          aria-label={`Borrar ${template.name}`}
        >
          <Trash2 />
          Borrar
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Borrar «{template.name}»?</AlertDialogTitle>
          <AlertDialogDescription>
            Desaparecerá de la biblioteca para todos los fisioterapeutas. Los
            programas de los pacientes que la usaron no cambian.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={() => deleteTemplate.mutate(template.id)}>
            Borrar plantilla
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
