import { useQuery } from '@tanstack/react-query';
import { physiotherapistsApi } from './physiotherapists.api';

/** List of physios. Only admins can load it, so pass `enabled: false` for everyone else. */
export function usePhysiotherapists(enabled: boolean) {
  return useQuery({
    queryKey: ['physiotherapists'],
    queryFn: physiotherapistsApi.getAll,
    enabled,
  });
}
