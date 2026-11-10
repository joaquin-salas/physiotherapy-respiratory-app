import { Link, useNavigate } from 'react-router';
import { BottomBar } from '@/components/bottom-bar';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { BackToTemplates } from './BackToTemplates';
import type { SaveRoutineTemplateInput } from './routine-templates.api';
import { useCreateRoutineTemplate } from './routine-templates.hooks';
import { RoutineTemplateForm } from './RoutineTemplateForm';

/** Full page to create a routine template. After saving it opens the new template. */
export function NewRoutineTemplatePage() {
  const navigate = useNavigate();
  const createTemplate = useCreateRoutineTemplate();

  async function save(input: SaveRoutineTemplateInput) {
    const created = await createTemplate.mutateAsync(input);
    // replace: "back" from the detail goes to the list, not to an empty form
    await navigate(`/templates/${created.id}`, { replace: true });
  }

  return (
    // pb-24 leaves room for the bottom bar, which covers the end of the page
    <div className="pb-24">
      <BackToTemplates />
      <PageHeader
        title="Nueva plantilla"
        description="Una rutina preestablecida que cualquier fisioterapeuta puede cargar en un programa."
      />

      <RoutineTemplateForm id="new-template-form" onSubmit={save} />

      <BottomBar>
        <Button variant="ghost" className="h-11 px-4" asChild>
          <Link to="/templates">Cancelar</Link>
        </Button>
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-sm text-muted-foreground">
            Los campos con * son obligatorios.
          </span>
          <Button
            type="submit"
            form="new-template-form"
            className="h-11 px-4"
            disabled={createTemplate.isPending}
          >
            {createTemplate.isPending ? 'Guardando…' : 'Crear plantilla'}
          </Button>
        </div>
      </BottomBar>
    </div>
  );
}
