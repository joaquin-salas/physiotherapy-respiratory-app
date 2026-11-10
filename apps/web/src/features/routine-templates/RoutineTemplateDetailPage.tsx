import { Pencil, Trash2 } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router';
import { BottomBar } from '@/components/bottom-bar';
import { PageHeader } from '@/components/page-header';
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
import { Button } from '@/components/ui/button';
import { ExerciseLinesView } from '@/features/programs/ExerciseLinesView';
import { profileLabels } from '@/features/programs/programs.labels';
import { ApiError } from '@/lib/api-client';
import { BackToTemplates } from './BackToTemplates';
import type {
  RoutineTemplate,
  SaveRoutineTemplateInput,
} from './routine-templates.api';
import {
  useDeleteRoutineTemplate,
  useRoutineTemplate,
  useUpdateRoutineTemplate,
} from './routine-templates.hooks';
import { RoutineTemplateForm } from './RoutineTemplateForm';

/** One template: its data and exercises, with "Editar" (switches the page to the form) and "Eliminar". */
export function RoutineTemplateDetailPage() {
  const { id = '' } = useParams();
  const {
    data: template,
    isPending,
    isError,
    error,
    refetch,
  } = useRoutineTemplate(id);

  if (isPending) {
    return <p className="text-muted-foreground">Cargando plantilla…</p>;
  }

  if (isError) {
    return (
      <div className="flex flex-col gap-4">
        <BackToTemplates />
        {error instanceof ApiError && error.status === 404 ? (
          <p>Plantilla no encontrada.</p>
        ) : (
          <div className="text-destructive">
            <p>No se pudo cargar la plantilla.</p>
            <button className="mt-2 underline" onClick={() => refetch()}>
              Reintentar
            </button>
          </div>
        )}
      </div>
    );
  }

  return <TemplateDetail template={template} />;
}

function TemplateDetail({ template }: { template: RoutineTemplate }) {
  const [editing, setEditing] = useState(false);
  const updateTemplate = useUpdateRoutineTemplate(template.id);

  async function save(input: SaveRoutineTemplateInput) {
    await updateTemplate.mutateAsync(input);
    setEditing(false);
  }

  return (
    // In edit mode, pb-24 leaves room for the bottom bar
    <div className={editing ? 'pb-24' : undefined}>
      <BackToTemplates />
      <PageHeader
        title={template.name}
        description={
          template.profile
            ? profileLabels[template.profile]
            : 'Para cualquier perfil'
        }
        actions={
          !editing && (
            <div className="flex gap-2">
              <Button className="h-11 px-4" onClick={() => setEditing(true)}>
                <Pencil />
                Editar
              </Button>
              <DeleteTemplateButton template={template} />
            </div>
          )
        }
      />

      {editing ? (
        <>
          <p className="mb-8 text-sm text-muted-foreground">
            Los cambios no afectan a los programas que ya cargaron esta
            plantilla: al cargarla se copian sus ejercicios.
          </p>

          <RoutineTemplateForm
            id="edit-template-form"
            template={template}
            onSubmit={save}
          />

          <BottomBar>
            <Button
              variant="ghost"
              className="h-11 px-4"
              onClick={() => setEditing(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              form="edit-template-form"
              className="h-11 px-4"
              disabled={updateTemplate.isPending}
            >
              {updateTemplate.isPending ? 'Guardando…' : 'Guardar cambios'}
            </Button>
          </BottomBar>
        </>
      ) : (
        <div className="flex flex-col gap-8">
          <dl>
            <InfoRow label="Perfil">
              {template.profile
                ? profileLabels[template.profile]
                : 'Cualquiera'}
            </InfoRow>
            <InfoRow label="Descripción">
              {template.description && (
                <span className="whitespace-pre-line">
                  {template.description}
                </span>
              )}
            </InfoRow>
          </dl>

          <section className="flex flex-col gap-2">
            <h2 className="text-lg font-bold">Ejercicios</h2>
            <ExerciseLinesView lines={template.exercises} />
          </section>
        </div>
      )}
    </div>
  );
}

/** "Eliminar" with confirmation. Programs based on the template keep their exercises. */
function DeleteTemplateButton({ template }: { template: RoutineTemplate }) {
  const navigate = useNavigate();
  const deleteTemplate = useDeleteRoutineTemplate();
  const [failed, setFailed] = useState(false);

  async function remove() {
    setFailed(false);
    try {
      await deleteTemplate.mutateAsync(template.id);
      await navigate('/templates', { replace: true });
    } catch {
      setFailed(true);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="outline"
            className="h-11 px-4"
            disabled={deleteTemplate.isPending}
          >
            <Trash2 />
            Eliminar
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar «{template.name}»?</AlertDialogTitle>
            <AlertDialogDescription>
              Desaparecerá de la biblioteca para todos los fisioterapeutas. Los
              programas de los pacientes que la usaron no cambian.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={remove}>
              Eliminar plantilla
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {failed && (
        <p role="alert" className="text-sm text-destructive">
          No se pudo eliminar. Inténtelo de nuevo.
        </p>
      )}
    </div>
  );
}

/** One "label: value" line, ruled like the panel's tables. Empty values show a dash. */
function InfoRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[10rem_1fr] gap-4 border-b py-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd>{children || '—'}</dd>
    </div>
  );
}
