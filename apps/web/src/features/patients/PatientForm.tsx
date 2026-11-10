import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { DateInput } from '@/components/date-input';
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
import { SEXES, type Patient, type PatientInput } from './patients.api';
import { sexLabels } from './patients.labels';

interface PatientFormProps {
  /** The <form> id, so submit buttons outside it (dialog footer, wizard bar) can use `form={id}` */
  id: string;
  /** Without it the form is empty (new patient); with it, it's filled for editing */
  patient?: Patient;
  /** Saves the data. If it throws, the form shows the error. */
  onSubmit: (input: PatientInput) => Promise<unknown>;
  onDirtyChange?: (dirty: boolean) => void;
}

/**
 * Personal and clinical data of a patient. Used by the "Nuevo paciente" wizard and the edit dialog.
 * Each section puts its title on the left when there's room (wizard page) and on top when not (dialog).
 */
export function PatientForm({
  id,
  patient,
  onSubmit,
  onDirtyChange,
}: PatientFormProps) {
  const { data: user } = useCurrentUser();
  const isAdmin = user?.role === 'ADMIN';
  const { data: physiotherapists = [] } = usePhysiotherapists(isAdmin);

  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isDirty },
  } = useForm<PatientFormValues>({
    resolver: zodResolver(makePatientFormSchema(isAdmin)),
    defaultValues: patient ? toPatientFormValues(patient) : emptyPatientForm,
  });

  useEffect(() => onDirtyChange?.(isDirty), [isDirty, onDirtyChange]);

  async function submit(values: PatientFormValues) {
    try {
      await onSubmit(toPatientInput(values, isAdmin));
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        setError(
          'nationalId',
          { message: 'Ya existe un paciente con ese DNI/NIE' },
          { shouldFocus: true },
        );
      } else if (error instanceof ApiError && error.status === 400) {
        setError('root', { message: 'Algún dato no es válido. Revísalos.' });
      } else {
        setError('root', { message: 'No se pudo conectar con el servidor' });
      }
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
        title="Datos personales"
        description="Se guardan aparte de los datos clínicos. No aparecen en la hoja de conexión."
      >
        {isAdmin && (
          <Field
            data-invalid={!!errors.physiotherapistId}
            className="sm:col-span-2"
          >
            <FieldLabel htmlFor="physiotherapistId">Fisioterapeuta *</FieldLabel>
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

        <Field data-invalid={!!errors.fullName} className="sm:col-span-2">
          <FieldLabel htmlFor="fullName">Nombre y apellidos *</FieldLabel>
          <Input
            id="fullName"
            aria-invalid={!!errors.fullName}
            {...register('fullName')}
          />
          <FieldError errors={[errors.fullName]} />
        </Field>

        <Field data-invalid={!!errors.birthDate}>
          <FieldLabel htmlFor="birthDate">Fecha de nacimiento *</FieldLabel>
          <Controller
            name="birthDate"
            control={control}
            render={({ field }) => (
              <DateInput
                id="birthDate"
                min={BIRTH_DATE_MIN}
                max={todayIso()}
                dropdowns
                aria-invalid={!!errors.birthDate}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                ref={field.ref}
              />
            )}
          />
          <FieldError errors={[errors.birthDate]} />
        </Field>

        <Field>
          <FieldLabel htmlFor="sex">Sexo</FieldLabel>
          <Controller
            name="sex"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
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
      </FormSection>

      <div className="border-t" />

      <FormSection
        title="Datos clínicos"
        description="Solo el diagnóstico es obligatorio. Puede completar el resto más adelante."
      >
        <Field data-invalid={!!errors.diagnosis} className="sm:col-span-2">
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
          <FieldLabel htmlFor="surgeryDate">Fecha de cirugía</FieldLabel>
          <Controller
            name="surgeryDate"
            control={control}
            render={({ field }) => (
              <DateInput
                id="surgeryDate"
                min={SURGERY_DATE_MIN}
                max={SURGERY_DATE_MAX}
                dropdowns
                aria-invalid={!!errors.surgeryDate}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                ref={field.ref}
              />
            )}
          />
          <FieldDescription>Puede ser futura (prehabilitación).</FieldDescription>
          <FieldError errors={[errors.surgeryDate]} />
        </Field>

        <Field className="sm:col-span-2">
          <FieldLabel htmlFor="currentTreatment">Tratamiento actual</FieldLabel>
          <Input
            id="currentTreatment"
            placeholder="Quimioterapia, radioterapia…"
            {...register('currentTreatment')}
          />
        </Field>

        <Field data-invalid={!!errors.weightKg}>
          <FieldLabel htmlFor="weightKg">Peso (kg)</FieldLabel>
          <Controller
            name="weightKg"
            control={control}
            render={({ field }) => (
              <NumberInput
                id="weightKg"
                min={20}
                max={300}
                decimal
                aria-invalid={!!errors.weightKg}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                ref={field.ref}
              />
            )}
          />
          <FieldError errors={[errors.weightKg]} />
        </Field>

        <Field data-invalid={!!errors.heightCm}>
          <FieldLabel htmlFor="heightCm">Altura (cm)</FieldLabel>
          <Controller
            name="heightCm"
            control={control}
            render={({ field }) => (
              <NumberInput
                id="heightCm"
                min={100}
                max={250}
                aria-invalid={!!errors.heightCm}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                ref={field.ref}
              />
            )}
          />
          <FieldError errors={[errors.heightCm]} />
        </Field>

        <Field className="sm:col-span-2">
          <FieldLabel htmlFor="comorbidities">Comorbilidades</FieldLabel>
          <Input
            id="comorbidities"
            placeholder="EPOC, diabetes"
            {...register('comorbidities')}
          />
          <FieldDescription>Separadas por comas.</FieldDescription>
        </Field>

        <Field className="sm:col-span-2">
          <FieldLabel htmlFor="initialAssessment">Valoración inicial</FieldLabel>
          <Textarea
            id="initialAssessment"
            rows={4}
            {...register('initialAssessment')}
          />
        </Field>
      </FormSection>

      <FieldError errors={[errors.root]} />
    </form>
  );
}
