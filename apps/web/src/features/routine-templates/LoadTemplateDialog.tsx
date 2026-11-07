import { FileDown } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { ProgramProfile } from '@/features/programs/programs.api';
import {
  formatEffort,
  formatPrescription,
  profileLabels,
} from '@/features/programs/programs.labels';
import type { RoutineTemplate } from './routine-templates.api';
import { useRoutineTemplates } from './routine-templates.hooks';

interface LoadTemplateDialogProps {
  /** The program's profile: shown first so the physio sees the relevant templates */
  profile: ProgramProfile | null;
  /** The routine already has exercises that loading would replace */
  willReplace: boolean;
  onLoad: (template: RoutineTemplate) => void;
}

/** "Cargar plantilla" button + a list of templates to fill the current routine */
export function LoadTemplateDialog({
  profile,
  willReplace,
  onLoad,
}: LoadTemplateDialogProps) {
  const [open, setOpen] = useState(false);
  const [onlyProfile, setOnlyProfile] = useState(true);
  const filterByProfile = onlyProfile && profile !== null;
  const { data: templates, isPending } = useRoutineTemplates(
    filterByProfile ? profile : undefined,
  );

  function choose(template: RoutineTemplate) {
    onLoad(template);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          <FileDown />
          Cargar plantilla
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[80svh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Cargar una plantilla en esta rutina</DialogTitle>
          <DialogDescription>
            {willReplace
              ? 'Los ejercicios actuales de la rutina se sustituirán por los de la plantilla. '
              : ''}
            Después podrás elegir los días y ajustar lo que necesites.
          </DialogDescription>
        </DialogHeader>

        {profile && (
          <Tabs
            value={onlyProfile ? 'profile' : 'all'}
            onValueChange={(value) => setOnlyProfile(value === 'profile')}
          >
            <TabsList>
              <TabsTrigger value="profile">
                {profileLabels[profile]}
              </TabsTrigger>
              <TabsTrigger value="all">Todas</TabsTrigger>
            </TabsList>
          </Tabs>
        )}

        {isPending ? (
          <p className="text-muted-foreground">Cargando plantillas…</p>
        ) : !templates || templates.length === 0 ? (
          <p className="text-muted-foreground">
            No hay plantillas
            {filterByProfile ? ' para este perfil' : ''}.{' '}
            <Link to="/templates" className="underline">
              Crear plantillas
            </Link>
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {templates.map((template) => (
              <li
                key={template.id}
                className="flex items-start justify-between gap-4 rounded-lg border p-3"
              >
                <div className="min-w-0">
                  <p className="flex items-center gap-2 font-medium">
                    {template.name}
                    {template.profile && (
                      <Badge variant="secondary">
                        {profileLabels[template.profile]}
                      </Badge>
                    )}
                  </p>
                  {template.description && (
                    <p className="text-sm text-muted-foreground">
                      {template.description}
                    </p>
                  )}
                  <ul className="mt-1 text-sm text-muted-foreground">
                    {template.exercises.map((line) => (
                      <li key={line.id}>
                        {line.exercise.name} · {formatPrescription(line)}
                        {line.targetEffortPct !== null &&
                          ` · ${formatEffort(line.targetEffortPct)}`}
                      </li>
                    ))}
                  </ul>
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => choose(template)}
                >
                  Cargar
                </Button>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}
