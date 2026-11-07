import { apiClient } from '@/lib/api-client';

// Types copied by hand from the API (apps/api/prisma/schema.prisma + patients DTOs).
// Keep them in sync when the API changes.

export const SEXES = ['FEMALE', 'MALE'] as const;
export type Sex = (typeof SEXES)[number];

export type PatientStatus = 'active' | 'discharged';

/** Identifying data (stored apart from the clinical data) */
export interface PatientIdentity {
  fullName: string;
  birthDate: string; // ISO date, e.g. "1950-03-15T00:00:00.000Z"
  phone: string | null;
  nationalId: string | null; // DNI/NIE
}

/** A patient as returned by the API */
export interface Patient {
  id: string;
  userId: string;
  sex: Sex | null;
  weightKg: number | null;
  heightCm: number | null;
  diagnosis: string;
  stage: string | null;
  currentTreatment: string | null;
  surgeryDate: string | null;
  comorbidities: string[];
  initialAssessment: string | null;
  dischargedAt: string | null; // null = active
  createdAt: string;
  updatedAt: string;
  identity: PatientIdentity | null;
  physiotherapist: { id: string; fullName: string };
}

/** Body of POST /api/patients (and PATCH, where every field is optional). `null` clears a field. */
export interface PatientInput {
  physiotherapistId?: string; // admins only
  identity: {
    fullName: string;
    birthDate: string; // "YYYY-MM-DD"
    phone: string | null;
    nationalId: string | null;
  };
  sex: Sex | null;
  weightKg: number | null;
  heightCm: number | null;
  diagnosis: string;
  stage: string | null;
  currentTreatment: string | null;
  surgeryDate: string | null;
  comorbidities: string[];
  initialAssessment: string | null;
}

export const patientsApi = {
  getAll: (status: PatientStatus) =>
    apiClient.get<Patient[]>(`/patients?status=${status}`),
  getOne: (id: string) => apiClient.get<Patient>(`/patients/${id}`),
  create: (data: PatientInput) => apiClient.post<Patient>('/patients', data),
  update: (id: string, data: Partial<PatientInput>) =>
    apiClient.patch<Patient>(`/patients/${id}`, data),
  discharge: (id: string) =>
    apiClient.post<Patient>(`/patients/${id}/discharge`, {}),
  reactivate: (id: string) =>
    apiClient.post<Patient>(`/patients/${id}/reactivate`, {}),
};
