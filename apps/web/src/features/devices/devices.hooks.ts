import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { devicesApi } from './devices.api';

const deviceKey = (patientId: string) => ['devices', patientId];

export function useDeviceStatus(patientId: string) {
  return useQuery({
    queryKey: deviceKey(patientId),
    queryFn: () => devicesApi.getStatus(patientId),
  });
}

export function useCreatePairingCode(patientId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => devicesApi.createPairingCode(patientId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: deviceKey(patientId) }),
  });
}

export function useDisconnectDevice(patientId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => devicesApi.disconnect(patientId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: deviceKey(patientId) }),
  });
}
