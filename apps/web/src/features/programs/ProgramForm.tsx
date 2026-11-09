import { zodResolver } from '@hookform/resolvers/zod';
import { Copy, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import {
  Controller,
  useFieldArray,
  useForm,
  useWatch,
  type FieldErrors,
} from 'react-hook-form';
import { Link } from 'react-router';
import { DateInput } from '@/components/date-input';
import { Button } from '@/components/ui/button';
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useExercises } from '@/features/exercises/exercises.hooks';
import { ApiError } from '@/lib/api-client';
import {
  duplicateRoutine,
  emptyProgramForm,
  emptyRoutine,
  programFormSchema,
  toProgramFormValues,
  toSaveProgramInput,
  type ProgramFormValues,
} from './program-form.schema';
import {
  MAX_ROUTINES,
  PROGRAM_PROFILES,
  type Program,
  type SaveProgramInput,
} from './programs.api';
import { formatDays, profileLabels } from './programs.labels';
import { RoutineFields } from './RoutineFields';

function saveErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 409)
      return 'No se puede guardar: el programa o el seguimiento ya han finalizado.';
    if (error.status === 400) return 'Algún dato no es válido. Revísalos.';
  }
  return 'No se pudo conectar con el servidor';
}

interface ProgramFormProps {
  /** The <form> id, so submit buttons outside it (dialog footer, wizard bar) can use `form={id}` */
  id: string;
  /** Without it the form is empty (new program); with it, it's filled for editing */
  program?: Program;
  /** Saves the program. If it throws, the form shows the error. */
  onSubmit: (input: SaveProgramInput) => Promise<unknown>;
}

/**
 * A program: name, profile, start date and its routines (one tab per routine, each with its
 * days and exercises). Used by the patient wizard and the program dialog in the patient record.
 */
export function ProgramForm({ id, program, onSubmit }: ProgramFormProps) {
  const [activeTab, setActiveTab] = useState(0);
  const { data: library = [] } = useExercises();

  const {
    register,
    control,
    handleSubmit,
    getValues,
    setValue,
    setError,
    formState: { errors },
  } = useForm<ProgramFormValues>({
    resolver: zodResolver(programFormSchema),
    defaultValues: program ? toProgramFormValues(program) : emptyProgramForm(),
  });

  // keyName: routines already have an `id` field (the database id)
  const routinesArray = useFieldArray({
    control,
    name: 'routines',
    keyName: 'fieldKey',
  });
  const routines = useWatch({ control, name: 'routines' }); // for the tab labels
  const canAddRoutine = routinesArray.fields.length < MAX_ROUTINES;

  function addRoutine() {
    const takenDays = getValues('routines').flatMap((r) => r.daysOfWeek);
    routinesArray.append(emptyRoutine(routinesArray.fields.length, takenDays));
    setActiveTab(routinesArray.fields.length);
  }

  function duplicateActiveRoutine() {
    const source = getValues(`routines.${activeTab}`);
    routinesArray.append(duplicateRoutine(source, routinesArray.fields.length));
    setActiveTab(routinesArray.fields.length);
  }

  function removeActiveRoutine() {
    routinesArray.remove(activeTab);
    setActiveTab(Math.max(0, activeTab - 1));
  }

  async function submit(values: ProgramFormValues) {
    try {
      await onSubmit(toSaveProgramInput(values));
    } catch (error) {
      setError('root', { message: saveErrorMessage(error) });
    }
  }

  // If the error is in a routine that isn't on screen, switch to its tab
  function onInvalid(formErrors: FieldErrors<ProgramFormValues>) {
    const firstWithError = formErrors.routines?.findIndex?.((r) => !!r);
    if (firstWithError !== undefined && firstWithError >= 0) {
      setActiveTab(firstWithError);
    }
  }

  return (
    <form
      id={id}
      onSubmit={handleSubmit(submit, onInvalid)}
      noValidate
      className="flex flex-col gap-7"
    >
      <div className="grid gap-5 sm:grid-cols-[2fr_1fr_1fr]">
        <Field data-invalid={!!errors.name}>
          <FieldLabel htmlFor="program-name">Nombre del programa *</FieldLabel>
          <Input
            id="program-name"
            placeholder="Prehabilitación fase 1"
            aria-invalid={!!errors.name}
            {...register('name')}
          />
          <FieldError errors={[errors.name]} />
        </Field>

        <Field>
          <FieldLabel htmlFor="program-profile">Perfil</FieldLabel>
          <Controller
            name="profile"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="program-profile" className="w-full">
                  <SelectValue placeholder="Sin indicar" />
                </SelectTrigger>
                <SelectContent>
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

        <Field data-invalid={!!errors.startDate}>
          <FieldLabel htmlFor="program-startDate">Inicio *</FieldLabel>
          <Controller
            name="startDate"
            control={control}
            render={({ field }) => (
              <DateInput
                id="program-startDate"
                min="2020-01-01"
                max="2099-12-31"
                todayShortcut
                aria-invalid={!!errors.startDate}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                ref={field.ref}
              />
            )}
          />
          {!program && <FieldDescription>Por defecto, hoy.</FieldDescription>}
          <FieldError errors={[errors.startDate]} />
        </Field>
      </div>

      {library.length === 0 ? (
        <p className="rounded-md border border-dashed p-4 text-muted-foreground">
          La biblioteca de ejercicios está vacía.{' '}
          <Link to="/exercises" className="underline">
            Crea ejercicios
          </Link>{' '}
          antes de montar un programa.
        </p>
      ) : (
        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap items-end justify-between gap-2 border-b">
            <Tabs
              value={String(activeTab)}
              onValueChange={(value) => setActiveTab(Number(value))}
            >
              {/* No own border: the row's border is the line under the tabs */}
              <TabsList className="h-11 border-b-0">
                {routinesArray.fields.map((field, index) => (
                  <TabsTrigger
                    key={field.fieldKey}
                    value={String(index)}
                    className="text-[15px]"
                  >
                    {routines[index]?.name || `Rutina ${index + 1}`}
                    {routines[index]?.daysOfWeek.length > 0 &&
                      ` · ${formatDays(routines[index].daysOfWeek)}`}
                    {errors.routines?.[index] && (
                      <span
                        className="size-2 rounded-full bg-destructive"
                        aria-label="Tiene errores"
                      />
                    )}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            <div className="flex gap-1 pb-1">
              {canAddRoutine && (
                <>
                  <Button
                    type="button"
                    variant="ghost"
                    className="text-primary"
                    onClick={addRoutine}
                  >
                    <Plus />
                    Añadir rutina
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={duplicateActiveRoutine}
                  >
                    <Copy />
                    Duplicar rutina
                  </Button>
                </>
              )}
              {routinesArray.fields.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={removeActiveRoutine}
                >
                  <Trash2 />
                  Quitar rutina
                </Button>
              )}
            </div>
          </div>

          {/* Only the selected routine is shown; the others keep their values */}
          <RoutineFields
            key={routinesArray.fields[activeTab]?.fieldKey}
            index={activeTab}
            control={control}
            register={register}
            setValue={setValue}
            errors={errors.routines?.[activeTab]}
            exercises={library}
          />
        </div>
      )}

      <FieldError errors={[errors.root]} />
    </form>
  );
}
