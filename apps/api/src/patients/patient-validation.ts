import { ValidateBy, ValidationOptions } from 'class-validator';

// Format checks for Spanish phone numbers and DNI/NIE.
// The web panel has a copy of these checks (patient-validation.ts) for instant feedback.

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

/**
 * DNI (8 digits + letter) or NIE (X/Y/Z + 7 digits + letter).
 * The letter is calculated from the numbers, so it catches most typos.
 */
export function isValidNationalId(value: string): boolean {
  const id = normalizeNationalId(value);
  const match = /^([XYZ]\d{7}|\d{8})([A-Z])$/.exec(id);
  if (!match) return false;
  // For a NIE, X/Y/Z count as 0/1/2
  const digits = match[1].replace('X', '0').replace('Y', '1').replace('Z', '2');
  return CONTROL_LETTERS[Number(digits) % 23] === match[2];
}

// ─── class-validator decorators for DTOs ─────────────────────────────

/** Empty strings pass: the service stores them as null */
export function IsSpanishPhone(options?: ValidationOptions) {
  return ValidateBy(
    {
      name: 'isSpanishPhone',
      validator: {
        validate: (value) =>
          typeof value === 'string' &&
          (value.trim() === '' || isValidSpanishPhone(value)),
        defaultMessage: () => '$property must be a valid Spanish phone number',
      },
    },
    options,
  );
}

/** Empty strings pass: the service stores them as null */
export function IsNationalId(options?: ValidationOptions) {
  return ValidateBy(
    {
      name: 'isNationalId',
      validator: {
        validate: (value) =>
          typeof value === 'string' &&
          (value.trim() === '' || isValidNationalId(value)),
        defaultMessage: () => '$property must be a valid DNI or NIE',
      },
    },
    options,
  );
}
