import { zodResolver } from '@hookform/resolvers/zod';
import { Copy, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import {
  Controller,
  useFieldArray,
  useForm,
  useWatch,
  type FieldErrors,
} from 'react-hook-form';
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
import { MAX_ROUTINES, PROGRAM_PROFILES, type Program } from './programs.api';
import { useCreateProgram, useUpdateProgram } from './programs.hooks';
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

type ProgramBuilderDialogProps =
  | { patientId: string; program?: undefined } // create
  | { program: Program; patientId?: undefined }; // edit

/**
 * Button + dialog to build a program: name, profile, start date and its routines
 * (one tab per routine, each with its days and exercises).
 * With `patientId` it assigns a new program; with `program` it edits that one.
 */
export function ProgramBuilderDialog(props: ProgramBuilderDialogProps) {
  const { program } = props;
  const isEdit = !!program;
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  const { data: library = [] } = useExercises();
  const createProgram = useCreateProgram(props.patientId ?? '');
  const updateProgram = useUpdateProgram(program?.id ?? '');

  const initialValues = () =>
    program ? toProgramFormValues(program) : emptyProgramForm();

  const {
    register,
    control,
    handleSubmit,
    reset,
    getValues,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ProgramFormValues>({
    resolver: zodResolver(programFormSchema),
    defaultValues: initialValues(),
  });

  // keyName: routines already have an `id` field (the database id)
  const routinesArray = useFieldArray({
    control,
    name: 'routines',
    keyName: 'fieldKey',
  });
  const routines = useWatch({ control, name: 'routines' }); // for the tab labels
  const canAddRoutine = routinesArray.fields.length < MAX_ROUTINES;

  function handleOpenChange(isOpen: boolean) {
    setOpen(isOpen);
    setActiveTab(0);
    reset(initialValues()); // opening shows fresh data; closing discards changes
  }

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

  async function onSubmit(values: ProgramFormValues) {
    const input = toSaveProgramInput(values);
    try {
      if (isEdit) await updateProgram.mutateAsync(input);
      else await createProgram.mutateAsync(input);
      setOpen(false);
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
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {isEdit ? (
          <Button variant="outline">
            <Pencil />
            Editar programa
          </Button>
        ) : (
          <Button>
            <Plus />
            Asignar programa
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Editar programa' : 'Nuevo programa'}
          </DialogTitle>
          <DialogDescription>
            Un programa tiene una o dos rutinas. Cada rutina se repite los días
            que elijas; los demás días son de descanso.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit, onInvalid)} noValidate>
          <FieldGroup>
            <div className="grid gap-4 sm:grid-cols-[2fr_1fr_1fr]">
              <Field data-invalid={!!errors.name}>
                <FieldLabel htmlFor="program-name">Nombre *</FieldLabel>
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
                <Input
                  id="program-startDate"
                  type="date"
                  min="2020-01-01"
                  max="2099-12-31"
                  aria-invalid={!!errors.startDate}
                  {...register('startDate')}
                />
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
              <div className="flex flex-col gap-4 rounded-lg bg-muted/40 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Tabs
                    value={String(activeTab)}
                    onValueChange={(value) => setActiveTab(Number(value))}
                  >
                    <TabsList>
                      {routinesArray.fields.map((field, index) => (
                        <TabsTrigger key={field.fieldKey} value={String(index)}>
                          {routines[index]?.name || `Rutina ${index + 1}`}
                          {routines[index]?.daysOfWeek.length > 0 && (
                            <span className="font-mono text-xs text-muted-foreground">
                              {formatDays(routines[index].daysOfWeek)}
                            </span>
                          )}
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

                  <div className="flex gap-1">
                    {canAddRoutine && (
                      <>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={duplicateActiveRoutine}
                        >
                          <Copy />
                          Duplicar rutina
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={addRoutine}
                        >
                          <Plus />
                          Añadir rutina
                        </Button>
                      </>
                    )}
                    {routinesArray.fields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
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
                  errors={errors.routines?.[activeTab]}
                  exercises={library}
                />
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
              {isSubmitting ? 'Guardando…' : 'Guardar programa'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
