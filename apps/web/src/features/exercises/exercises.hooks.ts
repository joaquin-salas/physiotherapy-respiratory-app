import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { exercisesApi, type CreateExerciseInput } from './exercises.api';

/** Cache key for the exercise list. Anything that changes exercises must invalidate it. */
const exercisesKey = ['exercises'];

/** Loads the exercise list (cached, with loading and error states). */
export function useExercises() {
  return useQuery({
    queryKey: exercisesKey,
    queryFn: exercisesApi.getAll,
  });
}

/** Creates an exercise, then refreshes the list automatically. */
export function useCreateExercise() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateExerciseInput) => exercisesApi.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: exercisesKey }),
  });
}
