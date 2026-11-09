import { Info } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

// VISUAL MOCKUP ONLY. Workout logging doesn't exist yet, so nothing computes these values.
// When it does, the API will return the level and the week per patient (rules and thresholds as editable data).

/** One day of the last week: trained, planned but not trained, or not a training day */
export type DayResult = 'done' | 'miss' | 'rest';

export type AdherenceLevel = 'good' | 'low' | 'missed' | 'unknown';

const LEVELS = {
  good: {
    label: 'Va bien',
    description: 'Ha hecho todas o casi todas las sesiones de los últimos 7 días.',
    fill: 'bg-success',
  },
  low: {
    label: 'Le cuesta',
    description: 'Ha faltado a algunas sesiones (menos del 70 %).',
    fill: 'bg-warning',
  },
  missed: {
    label: 'Necesita atención',
    description:
      'Lleva 3 o más días de entreno sin hacerlo, o tiene un aviso de seguridad pendiente.',
    fill: 'bg-destructive',
  },
  unknown: {
    label: 'Sin datos',
    description:
      'No tiene programa o app conectada, o empezó hace menos de una semana.',
    fill: 'bg-muted-foreground',
  },
} as const;

function DaySquare({ result, fill }: { result: DayResult; fill: string }) {
  if (result === 'done') {
    return <span className={cn('size-2.5 rounded-[2px]', fill)} />;
  }
  if (result === 'miss') {
    return (
      <span className="size-2.5 rounded-[2px] border-[1.5px] border-muted-foreground" />
    );
  }
  return (
    <span className="flex size-2.5 items-center justify-center">
      <span className="size-1 rounded-[1px] bg-input" />
    </span>
  );
}

/** Last 7 days (oldest first) as small squares, coloured by the patient's level */
export function AdherenceWeek({
  level,
  week,
}: {
  level: AdherenceLevel;
  week: DayResult[];
}) {
  const { label, fill } = LEVELS[level];
  const planned = week.filter((day) => day !== 'rest').length;
  const done = week.filter((day) => day === 'done').length;
  const summary =
    level === 'unknown' ? label : `${label}: ${done} de ${planned} sesiones`;

  return (
    <span title={summary} className="inline-flex h-6 items-center gap-[3px]">
      {week.map((result, index) => (
        <DaySquare key={index} result={result} fill={fill} />
      ))}
      <span className="sr-only">{summary}</span>
    </span>
  );
}

/** Column header: "Estado" + ⓘ button opening the legend (a popover, so it works on tap too) */
export function AdherenceLegendHeader({ preview }: { preview: boolean }) {
  return (
    <span className="inline-flex items-center gap-1">
      Estado
      <Popover>
        <PopoverTrigger
          aria-label="Qué significa la columna Estado"
          className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground"
        >
          <Info className="size-4" />
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="w-80 gap-4 p-4 text-sm font-normal tracking-normal normal-case"
        >
          <p className="font-semibold text-foreground">¿Está haciendo su programa?</p>

          <div className="flex flex-col gap-2">
            <p className="text-muted-foreground">Cada cuadro es un día de los últimos 7:</p>
            <ul className="flex flex-col gap-1.5 text-foreground">
              <li className="flex items-center gap-2.5">
                <DaySquare result="done" fill="bg-foreground" /> Entrenó
              </li>
              <li className="flex items-center gap-2.5">
                <DaySquare result="miss" fill="" /> Tocaba entrenar y no lo hizo
              </li>
              <li className="flex items-center gap-2.5">
                <DaySquare result="rest" fill="" /> Día de descanso
              </li>
            </ul>
          </div>

          <div className="flex flex-col gap-2 border-t pt-3">
            <p className="text-muted-foreground">El color resume cómo va:</p>
            <ul className="flex flex-col gap-2.5">
              {Object.entries(LEVELS).map(([key, item]) => (
                <li key={key} className="flex gap-2.5">
                  <span className={cn('mt-1 size-2.5 shrink-0 rounded-[2px]', item.fill)} />
                  <span>
                    <span className="font-semibold text-foreground">{item.label}.</span>{' '}
                    <span className="text-muted-foreground">{item.description}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {preview && (
            <p className="border-t pt-3 text-xs text-muted-foreground">
              Vista previa: los datos son de ejemplo hasta que la app guarde los entrenos.
            </p>
          )}
        </PopoverContent>
      </Popover>
    </span>
  );
}
