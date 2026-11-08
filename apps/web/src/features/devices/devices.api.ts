import { apiClient } from '@/lib/api-client';

// Types copied by hand from the API (apps/api/src/devices/devices.service.ts).
// Keep them in sync when the API changes.

/** GET /api/patients/:id/device */
export interface DeviceStatus {
  /** The connected patient app, or null */
  device: {
    name: string | null; // e.g. "Android"
    connectedAt: string;
    lastUsedAt: string;
  } | null;
  /** Expiry of a printed sheet that hasn't been used yet, or null */
  pendingCodeExpiresAt: string | null;
}

/** POST /api/patients/:id/pairing-code. The code is only returned once: it isn't stored. */
export interface PairingCode {
  code: string; // "K7QM4XPT9W"
  expiresAt: string;
}

export const devicesApi = {
  getStatus: (patientId: string) =>
    apiClient.get<DeviceStatus>(`/patients/${patientId}/device`),
  createPairingCode: (patientId: string) =>
    apiClient.post<PairingCode>(`/patients/${patientId}/pairing-code`, {}),
  disconnect: (patientId: string) =>
    apiClient.delete<void>(`/patients/${patientId}/device`),
};
