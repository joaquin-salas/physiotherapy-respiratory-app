import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ProgramProfile } from '@/features/programs/programs.api';
import { programsKey } from '@/features/programs/programs.hooks';
import {
  routineTemplatesApi,
  type SaveRoutineTemplateInput,
} from './routine-templates.api';

/** Every template query starts with this key */
const templatesKey = ['routine-templates'];

/** The template library, optionally only one profile */
export function useRoutineTemplates(profile?: ProgramProfile) {
  return useQuery({
    queryKey: [...templatesKey, profile ?? 'all'],
    queryFn: () => routineTemplatesApi.getAll(profile),
  });
}

/** One template (detail page) */
export function useRoutineTemplate(id: string) {
  return useQuery({
    queryKey: [...templatesKey, 'detail', id],
    queryFn: () => routineTemplatesApi.getOne(id),
  });
}

export function useCreateRoutineTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: SaveRoutineTemplateInput) =>
      routineTemplatesApi.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: templatesKey }),
  });
}

export function useUpdateRoutineTemplate(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: SaveRoutineTemplateInput) =>
      routineTemplatesApi.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: templatesKey }),
  });
}

export function useDeleteRoutineTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => routineTemplatesApi.delete(id),
    onSuccess: async (_data, id) => {
      // The detail no longer exists: drop it instead of refetching it (it would 404)
      queryClient.removeQueries({ queryKey: [...templatesKey, 'detail', id] });
      await queryClient.invalidateQueries({ queryKey: templatesKey });
      // Routines loaded from it lose their "based on" link
      await queryClient.invalidateQueries({ queryKey: programsKey });
    },
  });
}
