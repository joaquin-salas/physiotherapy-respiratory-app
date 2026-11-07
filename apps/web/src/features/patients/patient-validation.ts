// Format checks for Spanish phone numbers and DNI/NIE.
// Copy of apps/api/src/patients/patient-validation.ts: keep both in sync.
// The API checks again; these only give instant feedback in the form.

/** "+34 600-12 34 56" → "600123456": drops separators and the Spanish prefix */
export function normalizePhone(value: string): string {
  return value.replace(/[\s.\-()]/g, '').replace(/^(\+34|0034)/, '');
}

/** Spanish phone: 9 digits starting with 6, 7 (mobile) or 8, 9 (landline) */
export function isValidSpanishPhone(value: string): boolean {
  return /^[6789]\d{8}$/.test(normalizePhone(value));
}

/** " 12345678-z " → "12345678Z" */
export function normalizeNationalId(value: string): string {
  return value.replace(/[\s-]/g, '').toUpperCase();
}

const CONTROL_LETTERS = 'TRWAGMYFPDXBNJZSQVHLCKE';

/** DNI (8 digits + letter) or NIE (X/Y/Z + 7 digits + letter), with a valid control letter */
export function isValidNationalId(value: string): boolean {
  const id = normalizeNationalId(value);
  const match = /^([XYZ]\d{7}|\d{8})([A-Z])$/.exec(id);
  if (!match) return false;
  const digits = match[1].replace('X', '0').replace('Y', '1').replace('Z', '2');
  return CONTROL_LETTERS[Number(digits) % 23] === match[2];
}

/** Today as "YYYY-MM-DD" (the format of <input type="date">) */
export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}
