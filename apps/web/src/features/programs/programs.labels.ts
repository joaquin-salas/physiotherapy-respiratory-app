import {
  WEEKDAYS,
  type RoutineExercise,
  type ProgramProfile,
  type Weekday,
} from './programs.api';

/** Text shown to physios for each profile (the API uses English codes). */
export const profileLabels: Record<ProgramProfile, string> = {
  PREHAB: 'Prehabilitación',
  POST_SURGERY: 'Postcirugía',
  DURING_TREATMENT: 'Durante el tratamiento',
  SURVIVOR: 'Supervivientes',
};

/** One-letter day names used in Spain (X = miércoles) */
export const weekdayShort: Record<Weekday, string> = {
  MONDAY: 'L',
  TUESDAY: 'M',
  WEDNESDAY: 'X',
  THURSDAY: 'J',
  FRIDAY: 'V',
  SATURDAY: 'S',
  SUNDAY: 'D',
};

export const weekdayLong: Record<Weekday, string> = {
  MONDAY: 'Lunes',
  TUESDAY: 'Martes',
  WEDNESDAY: 'Miércoles',
  THURSDAY: 'Jueves',
  FRIDAY: 'Viernes',
  SATURDAY: 'Sábado',
  SUNDAY: 'Domingo',
};

/** 45 → "45 s", 300 → "5 min", 90 → "1 min 30 s" */
export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  if (minutes === 0) return `${rest} s`;
  return rest === 0 ? `${minutes} min` : `${minutes} min ${rest} s`;
}

/** "3 × 10 rep." or "2 × 5 min" */
export function formatPrescription(line: RoutineExercise): string {
  const amount =
    line.reps !== null
      ? `${line.reps} rep.`
      : formatDuration(line.durationSec ?? 0);
  return `${line.sets} × ${amount}`;
}

/** ["MONDAY", "FRIDAY"] → "L V"; all seven → "Todos los días" */
export function formatDays(days: Weekday[]): string {
  if (days.length === WEEKDAYS.length) return 'Todos los días';
  return WEEKDAYS.filter((day) => days.includes(day))
    .map((day) => weekdayShort[day])
    .join(' ');
}

/** Choices for the target perceived effort: 10 %, 20 % … 100 % */
export const EFFORT_OPTIONS = [
  10, 20, 30, 40, 50, 60, 70, 80, 90, 100,
] as const;

/** 50 → "50 %" (Spanish style, with a space) */
export function formatEffort(pct: number | null): string {
  return pct === null ? '—' : `${pct} %`;
}

/** Default routine names: "Rutina A", "Rutina B"… */
export function routineName(index: number): string {
  return `Rutina ${String.fromCharCode(65 + index)}`;
}
