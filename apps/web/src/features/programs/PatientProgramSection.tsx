import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Patient } from '@/features/patients/patients.api';
import { formatDate } from '@/features/patients/patients.labels';
import type { Program } from './programs.api';
import { useEndProgram, usePatientPrograms } from './programs.hooks';
import { profileLabels } from './programs.labels';
import { ProgramBuilderDialog } from './ProgramBuilderDialog';
import { RoutinesView } from './RoutinesView';

/** "Programa" block of the patient record: the active program and the history */
export function PatientProgramSection({ patient }: { patient: Patient }) {
  const {
    data: programs,
    isPending,
    isError,
    refetch,
  } = usePatientPrograms(patient.id);

  const active = programs?.find((p) => p.status === 'ACTIVE');
  const history = programs?.filter((p) => p.status === 'ENDED') ?? [];
  const followUpEnded = !!patient.dischargedAt;

  return (
    <section className="rounded-lg border p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-semibold">Programa de ejercicios</h2>
        {!isPending && !isError && (
          <div className="flex gap-2">
            {active ? (
              <>
                <ProgramBuilderDialog program={active} />
                <EndProgramButton program={active} />
              </>
            ) : (
              !followUpEnded && <ProgramBuilderDialog patientId={patient.id} />
            )}
          </div>
        )}
      </div>

      {isPending ? (
        <p className="text-muted-foreground">Cargando programa…</p>
      ) : isError ? (
        <div className="text-destructive">
          <p>No se pudo cargar el programa.</p>
          <button className="mt-2 underline" onClick={() => refetch()}>
            Reintentar
          </button>
        </div>
      ) : active ? (
        <div className="flex flex-col gap-3">
          <ProgramHeading program={active} />
          <RoutinesView routines={active.routines} />
        </div>
      ) : (
        <p className="text-muted-foreground">
          {followUpEnded
            ? 'El seguimiento ha finalizado: no se pueden asignar programas.'
            : 'Este paciente no tiene un programa activo.'}
        </p>
      )}

      {history.length > 0 && (
        <div className="mt-6 flex flex-col gap-2">
          <h3 className="text-sm font-medium text-muted-foreground">
            Programas anteriores
          </h3>
          {history.map((program) => (
            <details key={program.id} className="rounded-md border px-4 py-2">
              <summary className="text-sm">
                <span className="font-medium">{program.name}</span>
                <span className="text-muted-foreground">
                  {' · '}
                  {formatDate(program.startDate)} –{' '}
                  {program.endDate ? formatDate(program.endDate) : '…'}
                </span>
              </summary>
              <div className="mt-2">
                <RoutinesView routines={program.routines} />
              </div>
            </details>
          ))}
        </div>
      )}
    </section>
  );
}

function ProgramHeading({ program }: { program: Program }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <p className="text-lg font-medium">{program.name}</p>
      {program.profile && (
        <Badge variant="secondary">{profileLabels[program.profile]}</Badge>
      )}
      <span className="text-sm text-muted-foreground">
        desde el {formatDate(program.startDate)}
      </span>
    </div>
  );
}

function EndProgramButton({ program }: { program: Program }) {
  const endProgram = useEndProgram(program.id);

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" disabled={endProgram.isPending}>
          Finalizar programa
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Finalizar este programa?</AlertDialogTitle>
          <AlertDialogDescription>
            El paciente dejará de recibir estos ejercicios. El programa queda en
            el historial y no se podrá editar. Después podrás asignarle uno
            nuevo.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={() => endProgram.mutate()}>
            Finalizar programa
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
