import { ValidateBy, ValidationOptions } from 'class-validator';

// Format checks for Spanish phone numbers and DNI/NIE, plus "YYYY-MM-DD" dates.
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

/** A real calendar date written as "YYYY-MM-DD" (4-digit year) */
export function isDateOnly(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return (
    !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value) // rejects 2026-02-30
  );
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

/** "YYYY-MM-DD", a real date, optionally not in the future */
export function IsDateOnly(
  { notFuture = false } = {},
  options?: ValidationOptions,
) {
  return ValidateBy(
    {
      name: 'isDateOnly',
      validator: {
        validate: (value) =>
          typeof value === 'string' &&
          isDateOnly(value) &&
          (!notFuture || value <= new Date().toISOString().slice(0, 10)),
        defaultMessage: () =>
          notFuture
            ? '$property must be a YYYY-MM-DD date, not in the future'
            : '$property must be a YYYY-MM-DD date',
      },
    },
    options,
  );
}
