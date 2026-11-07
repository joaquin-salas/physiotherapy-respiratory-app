import type { Sex } from './patients.api';

/** Text shown to physios for each sex code (the API uses English codes). */
export const sexLabels: Record<Sex, string> = {
  FEMALE: 'Mujer',
  MALE: 'Hombre',
};

/**
 * Formats an ISO date as "15/03/1950".
 * Uses UTC because dates without time (birth date, surgery date) arrive as UTC midnight:
 * in local time they could show the previous day.
 */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-ES', { timeZone: 'UTC' });
}

/** Age in whole years from an ISO birth date */
export function ageFromBirthDate(iso: string): number {
  const birth = new Date(iso);
  const today = new Date();
  let age = today.getUTCFullYear() - birth.getUTCFullYear();
  const birthdayPassed =
    today.getUTCMonth() > birth.getUTCMonth() ||
    (today.getUTCMonth() === birth.getUTCMonth() &&
      today.getUTCDate() >= birth.getUTCDate());
  if (!birthdayPassed) age -= 1;
  return age;
}
