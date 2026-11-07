import { zodResolver } from '@hookform/resolvers/zod';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
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
  FieldDescription,
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
import { ApiError } from '@/lib/api-client';
import {
  emptyExerciseForm,
  exerciseFormSchema,
  toCreateExerciseInput,
  type ExerciseFormValues,
} from './exercise-form.schema';
import { EXERCISE_GOALS } from './exercises.api';
import { useCreateExercise } from './exercises.hooks';
import { goalLabels } from './exercises.labels';

/** "New exercise" button that opens a dialog with the create form. */
export function CreateExerciseDialog() {
  const [open, setOpen] = useState(false);
  const createExercise = useCreateExercise();

  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ExerciseFormValues>({
    resolver: zodResolver(exerciseFormSchema),
    defaultValues: emptyExerciseForm,
  });

  async function onSubmit(values: ExerciseFormValues) {
    try {
      await createExercise.mutateAsync(toCreateExerciseInput(values));
      reset();
      setOpen(false);
    } catch (error) {
      // Errors from the API (validation, server down...) are shown at the bottom of the form
      const message =
        error instanceof ApiError
          ? error.messages.join('. ')
          : 'No se pudo conectar con el servidor';
      setError('root', { message });
    }
  }

  function handleOpenChange(isOpen: boolean) {
    setOpen(isOpen);
    if (!isOpen) reset(); // closing the dialog discards what was typed
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus />
          Nuevo ejercicio
        </Button>
      </DialogTrigger>

      {/* max-h + overflow: on short screens the form scrolls inside the dialog */}
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nuevo ejercicio</DialogTitle>
          <DialogDescription>
            Añade un ejercicio a la biblioteca.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <FieldGroup>
            <Field data-invalid={!!errors.name}>
              <FieldLabel htmlFor="name">Nombre</FieldLabel>
              <Input
                id="name"
                aria-invalid={!!errors.name}
                {...register('name')}
              />
              <FieldError errors={[errors.name]} />
            </Field>

            <Field data-invalid={!!errors.description}>
              <FieldLabel htmlFor="description">Descripción</FieldLabel>
              <Textarea
                id="description"
                rows={3}
                aria-invalid={!!errors.description}
                {...register('description')}
              />
              <FieldError errors={[errors.description]} />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field data-invalid={!!errors.goal}>
                <FieldLabel htmlFor="goal">Objetivo</FieldLabel>
                {/* Select is not a native input, so it is connected with Controller instead of register */}
                <Controller
                  name="goal"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value ?? ''}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger
                        id="goal"
                        className="w-full"
                        aria-invalid={!!errors.goal}
                      >
                        <SelectValue placeholder="Elige uno" />
                      </SelectTrigger>
                      <SelectContent>
                        {EXERCISE_GOALS.map((goal) => (
                          <SelectItem key={goal} value={goal}>
                            {goalLabels[goal]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <FieldError errors={[errors.goal]} />
              </Field>

              <Field data-invalid={!!errors.level}>
                <FieldLabel htmlFor="level">Nivel (1–10)</FieldLabel>
                <Input
                  id="level"
                  type="number"
                  min={1}
                  max={10}
                  aria-invalid={!!errors.level}
                  {...register('level', { valueAsNumber: true })}
                />
                <FieldError errors={[errors.level]} />
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="equipment">Material</FieldLabel>
              <Input
                id="equipment"
                placeholder="silla, banda elástica"
                {...register('equipment')}
              />
              <FieldDescription>
                Separado por comas. Déjalo vacío si no necesita material.
              </FieldDescription>
            </Field>

            <Field data-invalid={!!errors.videoUrl}>
              <FieldLabel htmlFor="videoUrl">URL del vídeo (opcional)</FieldLabel>
              <Input
                id="videoUrl"
                type="url"
                placeholder="https://..."
                aria-invalid={!!errors.videoUrl}
                {...register('videoUrl')}
              />
              <FieldError errors={[errors.videoUrl]} />
            </Field>

            <Field>
              <FieldLabel htmlFor="contraindications">
                Contraindicaciones (opcional)
              </FieldLabel>
              <Textarea
                id="contraindications"
                rows={2}
                {...register('contraindications')}
              />
            </Field>

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
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Guardando…' : 'Guardar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
