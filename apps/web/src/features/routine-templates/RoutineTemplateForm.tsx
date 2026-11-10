import { zodResolver } from '@hookform/resolvers/zod';
import {
  Controller,
  useFieldArray,
  useForm,
  useWatch,
} from 'react-hook-form';
import { Link } from 'react-router';
import { FormSection } from '@/components/form-section';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useExercises } from '@/features/exercises/exercises.hooks';
import { ExerciseLinesEditor } from '@/features/programs/ExerciseLinesEditor';
import { PROGRAM_PROFILES } from '@/features/programs/programs.api';
import { profileLabels } from '@/features/programs/programs.labels';
import { ApiError } from '@/lib/api-client';
import type {
  RoutineTemplate,
  SaveRoutineTemplateInput,
} from './routine-templates.api';
import {
  emptyTemplateForm,
  templateFormSchema,
  toSaveTemplateInput,
  toTemplateFormValues,
  type TemplateFormValues,
} from './template-form.schema';

/** Radix Select doesn't allow an empty value, so "no profile" uses this placeholder value */
const NO_PROFILE = 'none';

interface RoutineTemplateFormProps {
  /** id of the <form>, so a submit button outside it (the bottom bar) can use form="..." */
  id: string;
  /** Template to edit; empty form when missing */
  template?: RoutineTemplate;
  onSubmit: (input: SaveRoutineTemplateInput) => Promise<unknown>;
}

/** Template editor (name, profile, description, exercises). Used by the "new" page and the detail's edit mode. */
export function RoutineTemplateForm({
  id,
  template,
  onSubmit,
}: RoutineTemplateFormProps) {
  const { data: library = [], isPending: libraryLoading } = useExercises();

  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<TemplateFormValues>({
    resolver: zodResolver(templateFormSchema),
    defaultValues: template ? toTemplateFormValues(template) : emptyTemplateForm(),
  });

  // keyName: lines have their own fields, so the internal React key uses a different name
  const { fields, append, remove, move, update } = useFieldArray({
    control,
    name: 'exercises',
    keyName: 'fieldKey',
  });
  const lines = useWatch({ control, name: 'exercises' });

  async function submit(values: TemplateFormValues) {
    try {
      await onSubmit(toSaveTemplateInput(values));
    } catch (error) {
      setError('root', {
        message:
          error instanceof ApiError && error.status === 400
            ? 'Algún dato no es válido. Revíselos.'
            : 'No se pudo conectar con el servidor',
      });
    }
  }

  const listError = errors.exercises?.root ?? errors.exercises;

  return (
    <form
      id={id}
      onSubmit={handleSubmit(submit)}
      noValidate
      className="@container flex flex-col gap-8"
    >
      <FormSection
        title="La plantilla"
        description="Los días se eligen al asignarla a cada paciente."
      >
        <Field data-invalid={!!errors.name}>
          <FieldLabel htmlFor="template-name">Nombre *</FieldLabel>
          <Input
            id="template-name"
            placeholder="Prehabilitación básica"
            aria-invalid={!!errors.name}
            {...register('name')}
          />
          <FieldError errors={[errors.name]} />
        </Field>

        <Field>
          <FieldLabel htmlFor="template-profile">Perfil</FieldLabel>
          <Controller
            name="profile"
            control={control}
            render={({ field }) => (
              <Select
                value={field.value || NO_PROFILE}
                onValueChange={(value) =>
                  field.onChange(value === NO_PROFILE ? '' : value)
                }
              >
                <SelectTrigger id="template-profile" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_PROFILE}>Cualquiera</SelectItem>
                  {PROGRAM_PROFILES.map((profile) => (
                    <SelectItem key={profile} value={profile}>
                      {profileLabels[profile]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </Field>

        <Field className="sm:col-span-2">
          <FieldLabel htmlFor="template-description">Descripción</FieldLabel>
          <Textarea
            id="template-description"
            rows={3}
            placeholder="Para qué pacientes es, objetivo, precauciones…"
            {...register('description')}
          />
        </Field>
      </FormSection>

      <div className="border-t" />

      <FormSection
        title="Ejercicios *"
        description="En el orden de la sesión. Arrastre el asa para cambiar el orden."
      >
        <div className="min-w-0 sm:col-span-2">
          {!libraryLoading && library.length === 0 ? (
            <p className="rounded-md border border-dashed p-4 text-muted-foreground">
              La biblioteca de ejercicios está vacía.{' '}
              <Link to="/exercises/new" className="underline">
                Cree un ejercicio
              </Link>{' '}
              antes de montar una plantilla.
            </p>
          ) : (
            <ExerciseLinesEditor
              fieldKeys={fields.map((f) => f.fieldKey)}
              lines={lines}
              exercises={library}
              emptyText="Aún no hay ejercicios. Añada el primero."
              isLineInvalid={(index) => !!errors.exercises?.[index]}
              listError={listError}
              onAdd={append}
              onEdit={update}
              onRemove={remove}
              onMove={move}
            />
          )}
        </div>
      </FormSection>

      <FieldError errors={[errors.root]} />
    </form>
  );
}
