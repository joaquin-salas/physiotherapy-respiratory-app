import { z } from 'zod';
import { SEXES, type Patient, type PatientInput } from './patients.api';
import {
  isValidNationalId,
  isValidSpanishPhone,
  normalizeNationalId,
  normalizePhone,
  todayIso,
} from './patient-validation';

/** Limits for the date inputs (min/max also stop typing a 5- or 6-digit year) */
export const BIRTH_DATE_MIN = '1900-01-01';
export const SURGERY_DATE_MIN = '2000-01-01';
export const SURGERY_DATE_MAX = '2099-12-31'; // may be in the future (prehabilitation)

const isDateBetween = (value: string, min: string, max: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(value) && value >= min && value <= max;

// Number fields are kept as text in the form (an empty input must stay empty, not 0 or NaN)
// and converted when sending. A Spanish decimal comma ("64,5") is accepted.
const toNumber = (text: string) => Number(text.replace(',', '.'));

const optionalNumber = (min: number, max: number, integer = false) =>
  z.string().refine(
    (text) => {
      if (text.trim() === '') return true;
      const n = toNumber(text);
      return (
        !Number.isNaN(n) &&
        n >= min &&
        n <= max &&
        (!integer || Number.isInteger(n))
      );
    },
    { error: `Debe ser un número entre ${min} y ${max}` },
  );

/**
 * Validation rules for the patient form (create and edit).
 * The API validates again: browser checks are for convenience, not security.
 */
export function makePatientFormSchema(isAdmin: boolean) {
  return z.object({
    physiotherapistId: isAdmin
      ? z.string().min(1, 'Elige un fisioterapeuta')
      : z.string(),
    fullName: z.string().trim().min(1, 'El nombre es obligatorio'),
    birthDate: z
      .string()
      .min(1, 'La fecha de nacimiento es obligatoria')
      .refine((v) => isDateBetween(v, BIRTH_DATE_MIN, todayIso()), {
        error: 'Introduce una fecha entre 1900 y hoy',
      }),
    phone: z.string().refine((v) => v.trim() === '' || isValidSpanishPhone(v), {
      error: 'Introduce un teléfono español de 9 cifras',
    }),
    nationalId: z
      .string()
      .refine((v) => v.trim() === '' || isValidNationalId(v), {
        error: 'DNI/NIE no válido. Revisa los números y la letra',
      }),
    sex: z.union([z.literal(''), z.enum(SEXES)]),
    weightKg: optionalNumber(20, 300),
    heightCm: optionalNumber(100, 250, true),
    diagnosis: z.string().trim().min(1, 'El diagnóstico es obligatorio'),
    stage: z.string(),
    currentTreatment: z.string(),
    surgeryDate: z
      .string()
      .refine(
        (v) => v === '' || isDateBetween(v, SURGERY_DATE_MIN, SURGERY_DATE_MAX),
        { error: 'Introduce una fecha válida' },
      ),
    comorbidities: z.string(), // comma-separated, e.g. "EPOC, diabetes"
    initialAssessment: z.string(),
  });
}

export type PatientFormValues = z.infer<
  ReturnType<typeof makePatientFormSchema>
>;

export const emptyPatientForm: PatientFormValues = {
  physiotherapistId: '',
  fullName: '',
  birthDate: '',
  phone: '',
  nationalId: '',
  sex: '',
  weightKg: '',
  heightCm: '',
  diagnosis: '',
  stage: '',
  currentTreatment: '',
  surgeryDate: '',
  comorbidities: '',
  initialAssessment: '',
};

/** Fills the form with an existing patient (edit mode) */
export function toPatientFormValues(patient: Patient): PatientFormValues {
  return {
    physiotherapistId: patient.physiotherapist.id,
    fullName: patient.identity?.fullName ?? '',
    birthDate: patient.identity?.birthDate.slice(0, 10) ?? '', // "YYYY-MM-DD" for <input type="date">
    phone: patient.identity?.phone ?? '',
    nationalId: patient.identity?.nationalId ?? '',
    sex: patient.sex ?? '',
    weightKg: patient.weightKg?.toString() ?? '',
    heightCm: patient.heightCm?.toString() ?? '',
    diagnosis: patient.diagnosis,
    stage: patient.stage ?? '',
    currentTreatment: patient.currentTreatment ?? '',
    surgeryDate: patient.surgeryDate?.slice(0, 10) ?? '',
    comorbidities: patient.comorbidities.join(', '),
    initialAssessment: patient.initialAssessment ?? '',
  };
}

/** Converts form values into the API body. Empty optional fields become null (clears them on edit). */
export function toPatientInput(
  values: PatientFormValues,
  isAdmin: boolean,
): PatientInput {
  const text = (value: string) => value.trim() || null;
  const number = (value: string) =>
    value.trim() === '' ? null : toNumber(value);

  return {
    physiotherapistId: isAdmin ? values.physiotherapistId : undefined,
    identity: {
      fullName: values.fullName.trim(),
      birthDate: values.birthDate,
      phone: text(normalizePhone(values.phone)),
      nationalId: text(normalizeNationalId(values.nationalId)),
    },
    sex: values.sex || null,
    weightKg: number(values.weightKg),
    heightCm: number(values.heightCm),
    diagnosis: values.diagnosis.trim(),
    stage: text(values.stage),
    currentTreatment: text(values.currentTreatment),
    surgeryDate: values.surgeryDate || null,
    comorbidities: values.comorbidities
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean),
    initialAssessment: text(values.initialAssessment),
  };
}
