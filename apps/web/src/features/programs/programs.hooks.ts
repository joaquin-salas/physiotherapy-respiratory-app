import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { programsApi, type SaveProgramInput } from './programs.api';

/** Every programs query starts with this key. Discharging a patient also invalidates it. */
export const programsKey = ['programs'];

/** A patient's programs: the active one first, then the history */
export function usePatientPrograms(patientId: string) {
  return useQuery({
    queryKey: [...programsKey, 'patient', patientId],
    queryFn: () => programsApi.getForPatient(patientId),
  });
}

export function useCreateProgram(patientId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: SaveProgramInput) => programsApi.create(patientId, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: programsKey }),
  });
}

export function useUpdateProgram(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: SaveProgramInput) => programsApi.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: programsKey }),
  });
}

export function useEndProgram(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => programsApi.end(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: programsKey }),
  });
}
