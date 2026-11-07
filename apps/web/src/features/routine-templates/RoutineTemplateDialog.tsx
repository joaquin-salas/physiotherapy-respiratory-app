import { zodResolver } from '@hookform/resolvers/zod';
import { Pencil, Plus } from 'lucide-react';
import { useState } from 'react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { Link } from 'react-router';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
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
import { emptyLine } from '@/features/programs/exercise-line.schema';
import { ExerciseLineFields } from '@/features/programs/ExerciseLineFields';
import { PROGRAM_PROFILES } from '@/features/programs/programs.api';
import { profileLabels } from '@/features/programs/programs.labels';
import { ApiError } from '@/lib/api-client';
import type { RoutineTemplate } from './routine-templates.api';
import {
  useCreateRoutineTemplate,
  useUpdateRoutineTemplate,
} from './routine-templates.hooks';
import {
  emptyTemplateForm,
  templateFormSchema,
  toSaveTemplateInput,
  toTemplateFormValues,
  type TemplateFormValues,
} from './template-form.schema';

/** Radix Select doesn't allow an empty value, so "no profile" uses this placeholder value */
const NO_PROFILE = 'none';

/**
 * Button + dialog with the template editor: name, profile, description and exercises.
 * Without `template` it creates a new one; with `template` it edits that one.
 */
export function RoutineTemplateDialog({
  template,
}: {
  template?: RoutineTemplate;
}) {
  const isEdit = !!template;
  const [open, setOpen] = useState(false);
  const { data: library = [] } = useExercises();
  const createTemplate = useCreateRoutineTemplate();
  const updateTemplate = useUpdateRoutineTemplate(template?.id ?? '');

  const initialValues = () =>
    template ? toTemplateFormValues(template) : emptyTemplateForm();

  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<TemplateFormValues>({
    resolver: zodResolver(templateFormSchema),
    defaultValues: initialValues(),
  });

  const { fields, append, remove, move } = useFieldArray({
    control,
    name: 'exercises',
    keyName: 'fieldKey',
  });

  function handleOpenChange(isOpen: boolean) {
    setOpen(isOpen);
    reset(initialValues()); // opening shows fresh data; closing discards changes
  }

  async function onSubmit(values: TemplateFormValues) {
    const input = toSaveTemplateInput(values);
    try {
      if (isEdit) await updateTemplate.mutateAsync(input);
      else await createTemplate.mutateAsync(input);
      setOpen(false);
    } catch (error) {
      setError('root', {
        message:
          error instanceof ApiError && error.status === 400
            ? 'Algún dato no es válido. Revísalos.'
            : 'No se pudo conectar con el servidor',
      });
    }
  }

  const listError = errors.exercises?.root ?? errors.exercises;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {isEdit ? (
          <Button variant="ghost" size="sm">
            <Pencil />
            Editar
          </Button>
        ) : (
          <Button>
            <Plus />
            Nueva plantilla
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Editar plantilla' : 'Nueva plantilla de rutina'}
          </DialogTitle>
          <DialogDescription>
            Los días se eligen al asignarla a cada paciente. Cambiar una
            plantilla no modifica los programas que ya la usan.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <FieldGroup>
            <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
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
            </div>

            <Field>
              <FieldLabel htmlFor="template-description">
                Descripción (opcional)
              </FieldLabel>
              <Textarea
                id="template-description"
                rows={2}
                placeholder="Para qué pacientes es, objetivo, precauciones…"
                {...register('description')}
              />
            </Field>

            {library.length === 0 ? (
              <p className="rounded-md border border-dashed p-4 text-muted-foreground">
                La biblioteca de ejercicios está vacía.{' '}
                <Link to="/exercises" className="underline">
                  Crea ejercicios
                </Link>{' '}
                antes de montar una plantilla.
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {fields.map((field, index) => (
                  <ExerciseLineFields
                    key={field.fieldKey}
                    basePath={`exercises.${index}`}
                    index={index}
                    total={fields.length}
                    control={control}
                    register={register}
                    errors={errors.exercises?.[index]}
                    exercises={library}
                    onMove={(to) => move(index, to)}
                    onRemove={() => remove(index)}
                  />
                ))}
                <FieldError errors={[listError]} />
                <Button
                  type="button"
                  variant="outline"
                  className="self-start"
                  onClick={() => append(emptyLine)}
                >
                  <Plus />
                  Añadir ejercicio
                </Button>
              </div>
            )}

            <FieldError errors={[errors.root]} />
          </FieldGroup>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || library.length === 0}
            >
              {isSubmitting ? 'Guardando…' : 'Guardar plantilla'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
