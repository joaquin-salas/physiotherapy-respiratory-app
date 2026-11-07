import { ValidateBy, ValidationOptions } from 'class-validator';

// Dates without time ("YYYY-MM-DD"), stored in @db.Date columns: birth date, surgery date,
// program start/end. Shared by every module that receives such dates.

/** A real calendar date written as "YYYY-MM-DD" (4-digit year) */
export function isDateOnly(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return (
    !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value) // rejects 2026-02-30
  );
}

/** Today as "YYYY-MM-DD" (UTC) */
export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Class-validator decorator: "YYYY-MM-DD", a real date, optionally not in the future */
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
          (!notFuture || value <= todayIso()),
        defaultMessage: () =>
          notFuture
            ? '$property must be a YYYY-MM-DD date, not in the future'
            : '$property must be a YYYY-MM-DD date',
      },
    },
    options,
  );
}
