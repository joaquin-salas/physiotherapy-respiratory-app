import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { FormSection } from '@/components/form-section';
import { NumberInput } from '@/components/number-input';
import {
  Field,
  FieldDescription,
  FieldError,
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
  toExerciseFormValues,
  toExerciseInput,
  type ExerciseFormValues,
} from './exercise-form.schema';
import { EXERCISE_GOALS, type Exercise, type ExerciseInput } from './exercises.api';
import { goalLabels } from './exercises.labels';

interface ExerciseFormProps {
  /** id of the <form>, so a submit button outside it can use form="..." */
  id: string;
  /** Exercise to edit; empty form when missing */
  exercise?: Exercise;
  onSubmit: (input: ExerciseInput) => Promise<unknown>;
}

/** Exercise fields, shared by the "new exercise" page and the edit mode of the detail page. */
export function ExerciseForm({ id, exercise, onSubmit }: ExerciseFormProps) {
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ExerciseFormValues>({
    resolver: zodResolver(exerciseFormSchema),
    defaultValues: exercise ? toExerciseFormValues(exercise) : emptyExerciseForm,
  });

  async function submit(values: ExerciseFormValues) {
    try {
      await onSubmit(toExerciseInput(values));
    } catch (error) {
      // Errors from the API (validation, server down...) are shown at the bottom of the form
      const message =
        error instanceof ApiError
          ? error.messages.join('. ')
          : 'No se pudo conectar con el servidor';
      setError('root', { message });
    }
  }

  return (
    <form
      id={id}
      onSubmit={handleSubmit(submit)}
      noValidate
      className="@container flex flex-col gap-8"
    >
      <FormSection
        title="El ejercicio"
        description="Lo que verá el paciente en la app: nombre y explicación."
      >
        <Field data-invalid={!!errors.name} className="sm:col-span-2">
          <FieldLabel htmlFor="name">Nombre *</FieldLabel>
          <Input id="name" aria-invalid={!!errors.name} {...register('name')} />
          <FieldError errors={[errors.name]} />
        </Field>

        <Field data-invalid={!!errors.description} className="sm:col-span-2">
          <FieldLabel htmlFor="description">Descripción *</FieldLabel>
          <Textarea
            id="description"
            rows={4}
            aria-invalid={!!errors.description}
            {...register('description')}
          />
          <FieldError errors={[errors.description]} />
        </Field>

        <Field data-invalid={!!errors.goal}>
          <FieldLabel htmlFor="goal">Objetivo *</FieldLabel>
          {/* Select is not a native input, so it is connected with Controller instead of register */}
          <Controller
            name="goal"
            control={control}
            render={({ field }) => (
              <Select value={field.value ?? ''} onValueChange={field.onChange}>
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
          <FieldLabel htmlFor="level">Nivel (1–10) *</FieldLabel>
          <Controller
            name="level"
            control={control}
            render={({ field }) => (
              <NumberInput
                id="level"
                min={1}
                max={10}
                aria-invalid={!!errors.level}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                ref={field.ref}
              />
            )}
          />
          <FieldError errors={[errors.level]} />
        </Field>
      </FormSection>

      <div className="border-t" />

      <FormSection
        title="Material y seguridad"
        description="Opcional. Puede completarlo más adelante."
      >
        <Field className="sm:col-span-2">
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

        <Field data-invalid={!!errors.videoUrl} className="sm:col-span-2">
          <FieldLabel htmlFor="videoUrl">URL del vídeo</FieldLabel>
          <Input
            id="videoUrl"
            type="url"
            placeholder="https://..."
            aria-invalid={!!errors.videoUrl}
            {...register('videoUrl')}
          />
          <FieldError errors={[errors.videoUrl]} />
        </Field>

        <Field className="sm:col-span-2">
          <FieldLabel htmlFor="contraindications">Contraindicaciones</FieldLabel>
          <Textarea
            id="contraindications"
            rows={3}
            {...register('contraindications')}
          />
        </Field>

      </FormSection>

      <FieldError errors={[errors.root]} />
    </form>
  );
}
