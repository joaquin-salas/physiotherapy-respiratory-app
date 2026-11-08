/** Name of the patient app as patients see it (placeholder until the final name is chosen) */
export const PATIENT_APP_NAME = 'Respira';

/** "K7QM4XPT9W" → "K7QM4-XPT9W": easier to read and type */
export function formatPairingCode(code: string) {
  return `${code.slice(0, 5)}-${code.slice(5)}`;
}
