import { zodResolver } from '@hookform/resolvers/zod';
import { Pencil, Plus } from 'lucide-react';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';
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
  FieldLegend,
  FieldSet,
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
import { useCurrentUser } from '@/features/auth/auth.hooks';
import { usePhysiotherapists } from '@/features/physiotherapists/physiotherapists.hooks';
import { ApiError } from '@/lib/api-client';
import {
  BIRTH_DATE_MIN,
  emptyPatientForm,
  makePatientFormSchema,
  SURGERY_DATE_MAX,
  SURGERY_DATE_MIN,
  toPatientFormValues,
  toPatientInput,
  type PatientFormValues,
} from './patient-form.schema';
import { todayIso } from './patient-validation';
import { SEXES, type Patient } from './patients.api';
import { useCreatePatient, useUpdatePatient } from './patients.hooks';
import { sexLabels } from './patients.labels';

function saveErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 409) return 'Ya existe un paciente con ese DNI/NIE';
    if (error.status === 400) return 'Algún dato no es válido. Revísalos.';
  }
  return 'No se pudo conectar con el servidor';
}

/**
 * Button + dialog with the patient form.
 * Without `patient` it creates a new one; with `patient` it edits that one.
 */
export function PatientFormDialog({ patient }: { patient?: Patient }) {
  const isEdit = !!patient;
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const { data: user } = useCurrentUser();
  const isAdmin = user?.role === 'ADMIN';
  const { data: physiotherapists = [] } = usePhysiotherapists(isAdmin);

  const createPatient = useCreatePatient();
  const updatePatient = useUpdatePatient(patient?.id ?? '');

  const initialValues = patient
    ? toPatientFormValues(patient)
    : emptyPatientForm;
  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<PatientFormValues>({
    resolver: zodResolver(makePatientFormSchema(isAdmin)),
    defaultValues: initialValues,
  });

  function handleOpenChange(isOpen: boolean) {
    setOpen(isOpen);
    reset(initialValues); // opening shows fresh data; closing discards changes
  }

  async function onSubmit(values: PatientFormValues) {
    const input = toPatientInput(values, isAdmin);
    try {
      if (isEdit) {
        await updatePatient.mutateAsync(input);
        setOpen(false);
      } else {
        const created = await createPatient.mutateAsync(input);
        setOpen(false);
        await navigate(`/patients/${created.id}`);
      }
    } catch (error) {
      setError('root', { message: saveErrorMessage(error) });
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {isEdit ? (
          <Button variant="outline">
            <Pencil />
            Editar
          </Button>
        ) : (
          <Button>
            <Plus />
            Nuevo paciente
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Editar paciente' : 'Nuevo paciente'}
          </DialogTitle>
          <DialogDescription>
            Los campos marcados con * son obligatorios.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <FieldGroup>
            {isAdmin && (
              <Field data-invalid={!!errors.physiotherapistId}>
                <FieldLabel htmlFor="physiotherapistId">
                  Fisioterapeuta *
                </FieldLabel>
                <Controller
                  name="physiotherapistId"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger
                        id="physiotherapistId"
                        className="w-full"
                        aria-invalid={!!errors.physiotherapistId}
                      >
                        <SelectValue placeholder="Elige uno" />
                      </SelectTrigger>
                      <SelectContent>
                        {physiotherapists.map((physio) => (
                          <SelectItem key={physio.id} value={physio.id}>
                            {physio.fullName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <FieldError errors={[errors.physiotherapistId]} />
              </Field>
            )}

            <FieldSet>
              <FieldLegend>Datos personales</FieldLegend>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  data-invalid={!!errors.fullName}
                  className="sm:col-span-2"
                >
                  <FieldLabel htmlFor="fullName">
                    Nombre y apellidos *
                  </FieldLabel>
                  <Input
                    id="fullName"
                    aria-invalid={!!errors.fullName}
                    {...register('fullName')}
                  />
                  <FieldError errors={[errors.fullName]} />
                </Field>

                <Field data-invalid={!!errors.birthDate}>
                  <FieldLabel htmlFor="birthDate">
                    Fecha de nacimiento *
                  </FieldLabel>
                  <Input
                    id="birthDate"
                    type="date"
                    min={BIRTH_DATE_MIN}
                    max={todayIso()}
                    aria-invalid={!!errors.birthDate}
                    {...register('birthDate')}
                  />
                  <FieldError errors={[errors.birthDate]} />
                </Field>

                <Field>
                  <FieldLabel htmlFor="sex">Sexo</FieldLabel>
                  <Controller
                    name="sex"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger id="sex" className="w-full">
                          <SelectValue placeholder="Sin indicar" />
                        </SelectTrigger>
                        <SelectContent>
                          {SEXES.map((sex) => (
                            <SelectItem key={sex} value={sex}>
                              {sexLabels[sex]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </Field>

                <Field data-invalid={!!errors.phone}>
                  <FieldLabel htmlFor="phone">Teléfono</FieldLabel>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="600 12 34 56"
                    aria-invalid={!!errors.phone}
                    {...register('phone')}
                  />
                  <FieldError errors={[errors.phone]} />
                </Field>

                <Field data-invalid={!!errors.nationalId}>
                  <FieldLabel htmlFor="nationalId">DNI/NIE</FieldLabel>
                  <Input
                    id="nationalId"
                    placeholder="12345678Z"
                    aria-invalid={!!errors.nationalId}
                    {...register('nationalId')}
                  />
                  <FieldError errors={[errors.nationalId]} />
                </Field>
              </div>
            </FieldSet>

            <FieldSet>
              <FieldLegend>Datos clínicos</FieldLegend>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  data-invalid={!!errors.diagnosis}
                  className="sm:col-span-2"
                >
                  <FieldLabel htmlFor="diagnosis">Diagnóstico *</FieldLabel>
                  <Input
                    id="diagnosis"
                    placeholder="Cáncer de pulmón no microcítico"
                    aria-invalid={!!errors.diagnosis}
                    {...register('diagnosis')}
                  />
                  <FieldError errors={[errors.diagnosis]} />
                </Field>

                <Field>
                  <FieldLabel htmlFor="stage">Estadio</FieldLabel>
                  <Input id="stage" placeholder="IIIA" {...register('stage')} />
                </Field>

                <Field data-invalid={!!errors.surgeryDate}>
                  <FieldLabel htmlFor="surgeryDate">
                    Fecha de cirugía
                  </FieldLabel>
                  <Input
                    id="surgeryDate"
                    type="date"
                    min={SURGERY_DATE_MIN}
                    max={SURGERY_DATE_MAX}
                    aria-invalid={!!errors.surgeryDate}
                    {...register('surgeryDate')}
                  />
                  <FieldError errors={[errors.surgeryDate]} />
                </Field>

                <Field className="sm:col-span-2">
                  <FieldLabel htmlFor="currentTreatment">
                    Tratamiento actual
                  </FieldLabel>
                  <Input
                    id="currentTreatment"
                    placeholder="Quimioterapia, radioterapia…"
                    {...register('currentTreatment')}
                  />
                </Field>

                <Field data-invalid={!!errors.weightKg}>
                  <FieldLabel htmlFor="weightKg">Peso (kg)</FieldLabel>
                  <Input
                    id="weightKg"
                    inputMode="decimal"
                    aria-invalid={!!errors.weightKg}
                    {...register('weightKg')}
                  />
                  <FieldError errors={[errors.weightKg]} />
                </Field>

                <Field data-invalid={!!errors.heightCm}>
                  <FieldLabel htmlFor="heightCm">Altura (cm)</FieldLabel>
                  <Input
                    id="heightCm"
                    inputMode="numeric"
                    aria-invalid={!!errors.heightCm}
                    {...register('heightCm')}
                  />
                  <FieldError errors={[errors.heightCm]} />
                </Field>

                <Field className="sm:col-span-2">
                  <FieldLabel htmlFor="comorbidities">
                    Comorbilidades
                  </FieldLabel>
                  <Input
                    id="comorbidities"
                    placeholder="EPOC, diabetes tipo 2"
                    {...register('comorbidities')}
                  />
                  <FieldDescription>Separadas por comas.</FieldDescription>
                </Field>

                <Field className="sm:col-span-2">
                  <FieldLabel htmlFor="initialAssessment">
                    Valoración inicial
                  </FieldLabel>
                  <Textarea
                    id="initialAssessment"
                    rows={4}
                    {...register('initialAssessment')}
                  />
                </Field>
              </div>
            </FieldSet>

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
