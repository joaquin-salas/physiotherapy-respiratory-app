import { ChevronRight, Printer, TriangleAlert } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router';
import { PageHeader } from '@/components/page-header';
import { StatusMarker } from '@/components/status-marker';
import { Button } from '@/components/ui/button';
import { ConnectionSheetPreview } from '@/features/devices/ConnectionSheetPreview';
import type { PairingCode } from '@/features/devices/devices.api';
import {
  useCreatePairingCode,
  useDeviceStatus,
} from '@/features/devices/devices.hooks';
import { useExercises } from '@/features/exercises/exercises.hooks';
import type { Program, SaveProgramInput } from '@/features/programs/programs.api';
import {
  useCreateProgram,
  usePatientPrograms,
  useUpdateProgram,
} from '@/features/programs/programs.hooks';
import { ProgramForm } from '@/features/programs/ProgramForm';
import { ApiError } from '@/lib/api-client';
import type { Patient } from './patients.api';
import { usePatient } from './patients.hooks';
import { ageFromBirthDate, formatDate } from './patients.labels';
import { WizardFrame } from './PatientWizard';

const footerButton = 'h-11 px-4';

/**
 * Steps 2 and 3 of the "Nuevo paciente" wizard, on a patient already saved:
 * ?step=program (assign a program, optional) and ?step=app (connection sheet, optional).
 */
export function PatientSetupPage() {
  const { id = '' } = useParams();
  const [searchParams] = useSearchParams();
  const step = searchParams.get('step') === 'app' ? 'app' : 'program';

  const patient = usePatient(id);
  const programs = usePatientPrograms(id);

  if (patient.isPending || programs.isPending) {
    return <p className="text-muted-foreground">Cargando paciente…</p>;
  }
  if (patient.isError || programs.isError) {
    const notFound =
      patient.error instanceof ApiError && patient.error.status === 404;
    return (
      <div className="flex flex-col gap-4">
        <Link to="/patients" className="text-sm text-primary hover:underline">
          Volver a pacientes
        </Link>
        {notFound ? (
          <p>Paciente no encontrado.</p>
        ) : (
          <p className="text-destructive">No se pudo cargar el paciente.</p>
        )}
      </div>
    );
  }

  const activeProgram = programs.data.find((p) => p.status === 'ACTIVE');
  return step === 'program' ? (
    <ProgramStep patient={patient.data} activeProgram={activeProgram} />
  ) : (
    <AppStep patient={patient.data} activeProgram={activeProgram} />
  );
}

interface StepProps {
  patient: Patient;
  activeProgram?: Program;
}

/** Name as the title, "72 años · diagnosis · stage" under it, and what's already saved on the right */
function PatientHeader({ patient, saved }: { patient: Patient; saved: string }) {
  const facts = [
    patient.identity && `${ageFromBirthDate(patient.identity.birthDate)} años`,
    patient.diagnosis,
    patient.stage,
  ].filter(Boolean);

  return (
    <PageHeader
      title={patient.identity?.fullName ?? 'Sin nombre'}
      description={facts.join(' · ')}
      actions={<StatusMarker tone="ok">{saved}</StatusMarker>}
    />
  );
}

/** Step 2: the program builder on the page. Skippable; it can be assigned later from the record. */
function ProgramStep({ patient, activeProgram }: StepProps) {
  const navigate = useNavigate();
  const { data: library = [] } = useExercises();
  const createProgram = useCreateProgram(patient.id);
  const updateProgram = useUpdateProgram(activeProgram?.id ?? '');
  const isSaving = createProgram.isPending || updateProgram.isPending;
  const nextStep = `/patients/${patient.id}/setup?step=app`;

  async function save(input: SaveProgramInput) {
    // Coming back to this step after saving edits the program instead of assigning another
    if (activeProgram) await updateProgram.mutateAsync(input);
    else await createProgram.mutateAsync(input);
    await navigate(nextStep);
  }

  return (
    <WizardFrame
      step={1}
      header={<PatientHeader patient={patient} saved="Paciente creado" />}
      footer={
        <>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" className={footerButton} asChild>
              <Link to={nextStep}>Omitir por ahora</Link>
            </Button>
            <span className="text-sm text-muted-foreground">
              Podrá asignarlo después desde la ficha.
            </span>
          </div>
          <Button
            type="submit"
            form="setup-program-form"
            className={footerButton}
            disabled={isSaving || library.length === 0}
          >
            {isSaving ? 'Guardando…' : 'Guardar programa y continuar'}
            <ChevronRight />
          </Button>
        </>
      }
    >
      <ProgramForm
        id="setup-program-form"
        program={activeProgram}
        onSubmit={save}
      />
    </WizardFrame>
  );
}

/**
 * Step 3: the connection sheet. The code is created only when the physio clicks
 * "Preparar hoja de conexión" (never on opening the step): it's shown only once and
 * each new one replaces the previous.
 */
function AppStep({ patient, activeProgram }: StepProps) {
  const { data: status } = useDeviceStatus(patient.id);
  const createCode = useCreatePairingCode(patient.id);
  const [pairing, setPairing] = useState<PairingCode | null>(null);
  const recordUrl = `/patients/${patient.id}`;

  const prepare = () =>
    createCode.mutate(undefined, { onSuccess: (data) => setPairing(data) });

  return (
    <WizardFrame
      step={2}
      programHint={activeProgram?.name ?? 'Omitido'}
      header={
        <PatientHeader
          patient={patient}
          saved={activeProgram ? 'Programa asignado' : 'Paciente creado'}
        />
      }
      footer={
        <>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" className={footerButton} asChild>
              <Link to={recordUrl}>Ahora no</Link>
            </Button>
            <span className="text-sm text-muted-foreground">
              Podrá prepararla después desde la ficha.
            </span>
          </div>
          <Button className={footerButton} asChild>
            <Link to={recordUrl}>
              Terminar e ir a la ficha
              <ChevronRight />
            </Link>
          </Button>
        </>
      }
    >
      <div className="flex flex-wrap items-start gap-10">
        <div className="flex max-w-xl flex-[1_1_18rem] flex-col gap-4.5">
          <h2 className="text-[22px] font-bold">Hoja de conexión</h2>
          <p className="leading-relaxed">
            Imprímala y métala en la bolsa del paciente. En casa, el paciente
            abre la app y escanea el código: no necesita usuario ni contraseña.
          </p>
          <ul className="flex flex-col gap-2.5 text-[15px]">
            <SquareItem>
              Sin nombre ni datos personales: si se pierde, no revela nada.
            </SquareItem>
            <SquareItem>Sirve una sola vez y caduca en 30 días.</SquareItem>
          </ul>

          {!activeProgram && (
            <p className="text-sm text-muted-foreground">
              Este paciente aún no tiene programa: la app mostrará que no hay
              ejercicios hasta que le asigne uno.
            </p>
          )}

          {pairing ? (
            <>
              <div className="flex gap-3 rounded-md border border-warning/50 bg-warning/10 px-4 py-3.5">
                <TriangleAlert
                  aria-hidden="true"
                  className="mt-0.5 size-5 shrink-0 text-warning"
                />
                <p className="text-sm leading-snug">
                  El código solo se muestra ahora. Si sale sin imprimir, tendrá
                  que preparar otra hoja desde la ficha.
                </p>
              </div>
              <Button
                className={`${footerButton} self-start`}
                onClick={() => window.print()}
              >
                <Printer />
                Imprimir hoja de conexión
              </Button>
            </>
          ) : (
            <>
              {status?.device && (
                <p className="text-sm">
                  La app ya está conectada
                  {status.device.name && ` en ${status.device.name}`}. Si
                  prepara una hoja nueva y el paciente la usa, se desconectará
                  de ese dispositivo.
                </p>
              )}
              {!status?.device && status?.pendingCodeExpiresAt && (
                <p className="text-sm">
                  Ya hay una hoja sin usar, válida hasta el{' '}
                  {formatDate(status.pendingCodeExpiresAt)}. Si prepara una
                  nueva, la anterior dejará de funcionar.
                </p>
              )}
              <Button
                className={`${footerButton} self-start`}
                disabled={createCode.isPending}
                onClick={prepare}
              >
                {createCode.isPending
                  ? 'Preparando…'
                  : 'Preparar hoja de conexión'}
              </Button>
              {createCode.isError && (
                <p className="text-sm text-destructive">
                  No se pudo preparar la hoja. Inténtelo de nuevo.
                </p>
              )}
            </>
          )}
        </div>

        {pairing && (
          <figure className="max-w-md flex-[1_1_22rem]">
            <ConnectionSheetPreview pairing={pairing} />
            <figcaption className="mt-2.5 text-center text-sm text-muted-foreground">
              Vista previa (A4 al imprimir)
            </figcaption>
          </figure>
        )}
      </div>
    </WizardFrame>
  );
}

/** List item with the brand's small square marker */
function SquareItem({ children }: { children: string }) {
  return (
    <li className="flex gap-2.5">
      <span
        aria-hidden="true"
        className="mt-1.5 size-2.5 shrink-0 rounded-[2px] bg-primary"
      />
      {children}
    </li>
  );
}
