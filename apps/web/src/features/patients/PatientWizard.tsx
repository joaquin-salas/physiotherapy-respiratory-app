import { Check, ChevronLeft } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { BottomBar } from '@/components/bottom-bar';
import { cn } from '@/lib/utils';

// Shared frame of the "Nuevo paciente" wizard: /patients/new (step 1, creates the patient)
// and /patients/:id/setup (steps 2 and 3, optional, on the patient already saved).

/** 0 = Datos del paciente, 1 = Programa, 2 = App del paciente */
export type WizardStep = 0 | 1 | 2;

interface WizardFrameProps {
  step: WizardStep;
  /** The page title block (PageHeader) */
  header: ReactNode;
  /** Under "Programa" once it's done: the program's name, or that it was skipped */
  programHint?: string;
  /** Buttons for the bar pinned at the bottom */
  footer: ReactNode;
  children: ReactNode;
}

/** Back link, title, step bar, the step's content and a bottom bar that stays visible while scrolling */
export function WizardFrame({
  step,
  header,
  programHint,
  footer,
  children,
}: WizardFrameProps) {
  return (
    // pb-24 leaves room for the bottom bar, which covers the end of the page
    <div className="pb-24">
      <div>
        <Link
          to="/patients"
          className="mb-3.5 inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
        >
          <ChevronLeft className="size-4" />
          Pacientes
        </Link>
        {header}
        <WizardSteps step={step} programHint={programHint} />
        {children}
      </div>

      <BottomBar>{footer}</BottomBar>
    </div>
  );
}

type StepState = 'done' | 'current' | 'upcoming';

function WizardSteps({
  step,
  programHint,
}: {
  step: WizardStep;
  programHint?: string;
}) {
  const stateOf = (index: WizardStep): StepState =>
    index < step ? 'done' : index === step ? 'current' : 'upcoming';

  const steps = [
    {
      label: 'Datos del paciente',
      hint: step > 0 ? 'Guardados' : 'Personales y clínicos',
    },
    { label: 'Programa', hint: step > 1 ? programHint : 'Opcional' },
    { label: 'App del paciente', hint: 'Opcional' },
  ];

  return (
    <ol aria-label="Pasos" className="mb-9 grid grid-cols-3 gap-4">
      {steps.map((item, index) => {
        const state = stateOf(index as WizardStep);
        return (
          <li
            key={item.label}
            aria-current={state === 'current' ? 'step' : undefined}
            className={cn(
              'flex items-start gap-3 border-t-[3px] pt-3',
              state === 'upcoming' ? 'border-border' : 'border-primary',
            )}
          >
            <span
              className={cn(
                'flex size-7 shrink-0 items-center justify-center rounded-sm text-sm font-bold',
                state === 'done' && 'bg-accent text-primary',
                state === 'current' && 'bg-primary text-primary-foreground',
                state === 'upcoming' &&
                  'border-[1.5px] border-muted-foreground text-muted-foreground',
              )}
            >
              {state === 'done' ? (
                <Check className="size-4" strokeWidth={2.5} aria-label="Hecho" />
              ) : (
                index + 1
              )}
            </span>
            <span className="flex min-w-0 flex-col gap-0.5">
              <span
                className={cn(
                  state === 'current' ? 'font-bold' : 'font-semibold',
                  state === 'upcoming' && 'text-muted-foreground',
                )}
              >
                {item.label}
              </span>
              <span className="truncate text-sm text-muted-foreground">
                {item.hint}
              </span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
