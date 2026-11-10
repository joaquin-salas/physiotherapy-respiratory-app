import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query';
import { programsKey } from '@/features/programs/programs.hooks';
import { exercisesApi, type ExerciseInput } from './exercises.api';

/** Cache key for exercises (list and each detail). Anything that changes exercises must invalidate it. */
const exercisesKey = ['exercises'];

/** Programs and templates show exercise names, so they are refreshed too. */
function invalidateExerciseData(queryClient: QueryClient) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: exercisesKey }),
    queryClient.invalidateQueries({ queryKey: programsKey }),
    queryClient.invalidateQueries({ queryKey: ['routine-templates'] }),
  ]);
}

/** Loads the exercise list (cached, with loading and error states). */
export function useExercises() {
  return useQuery({
    queryKey: exercisesKey,
    queryFn: exercisesApi.getAll,
  });
}

/** Loads one exercise. */
export function useExercise(id: string) {
  return useQuery({
    queryKey: [...exercisesKey, id],
    queryFn: () => exercisesApi.getOne(id),
  });
}

/** Creates an exercise, then refreshes the list automatically. */
export function useCreateExercise() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ExerciseInput) => exercisesApi.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: exercisesKey }),
  });
}

/** Updates an exercise. */
export function useUpdateExercise(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ExerciseInput) => exercisesApi.update(id, data),
    onSuccess: () => invalidateExerciseData(queryClient),
  });
}

/** Deletes an exercise. The API refuses (409) if it is used in a program or a template. */
export function useDeleteExercise(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => exercisesApi.remove(id),
    onSuccess: () => {
      // The detail no longer exists: drop it instead of refetching it (it would 404)
      queryClient.removeQueries({ queryKey: [...exercisesKey, id] });
      return queryClient.invalidateQueries({ queryKey: exercisesKey });
    },
  });
}
