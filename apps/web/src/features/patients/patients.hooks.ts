import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { programsKey } from '@/features/programs/programs.hooks';
import {
  patientsApi,
  type PatientInput,
  type PatientStatus,
} from './patients.api';

/** Every patients query starts with this key, so invalidating it refreshes lists and records. */
const patientsKey = ['patients'];

export function usePatients(status: PatientStatus) {
  return useQuery({
    queryKey: [...patientsKey, 'list', status],
    queryFn: () => patientsApi.getAll(status),
  });
}

export function usePatient(id: string) {
  return useQuery({
    queryKey: [...patientsKey, 'detail', id],
    queryFn: () => patientsApi.getOne(id),
  });
}

export function useCreatePatient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: PatientInput) => patientsApi.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: patientsKey }),
  });
}

export function useUpdatePatient(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<PatientInput>) => patientsApi.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: patientsKey }),
  });
}

export function useDischargePatient(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => patientsApi.discharge(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: patientsKey });
      // Ending the follow-up also ends the active program
      await queryClient.invalidateQueries({ queryKey: programsKey });
    },
  });
}

export function useReactivatePatient(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => patientsApi.reactivate(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: patientsKey }),
  });
}
