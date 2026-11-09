import { ArrowLeft } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link, useParams } from 'react-router';
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
import { useCurrentUser } from '@/features/auth/auth.hooks';
import { PatientAppSection } from '@/features/devices/PatientAppSection';
import { PatientProgramSection } from '@/features/programs/PatientProgramSection';
import { ApiError } from '@/lib/api-client';
import type { Patient } from './patients.api';
import {
  useDischargePatient,
  usePatient,
  useReactivatePatient,
} from './patients.hooks';
import { ageFromBirthDate, formatDate, sexLabels } from './patients.labels';
import { EditPatientDialog } from './EditPatientDialog';

/** Patient record: exercise program, personal and clinical data, edit and discharge. */
export function PatientDetailPage() {
  const { id = '' } = useParams();
  const { data: patient, isPending, isError, error, refetch } = usePatient(id);

  if (isPending) {
    return <p className="text-muted-foreground">Cargando paciente…</p>;
  }

  if (isError) {
    return (
      <div className="flex flex-col gap-4">
        <BackLink />
        {error instanceof ApiError && error.status === 404 ? (
          <p>Paciente no encontrado.</p>
        ) : (
          <div className="text-destructive">
            <p>No se pudo cargar el paciente.</p>
            <button className="mt-2 underline" onClick={() => refetch()}>
              Reintentar
            </button>
          </div>
        )}
      </div>
    );
  }

  return <PatientDetail patient={patient} />;
}

function PatientDetail({ patient }: { patient: Patient }) {
  const { data: user } = useCurrentUser();
  const identity = patient.identity;

  return (
    <div className="flex flex-col gap-6">
      <BackLink />

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold">
              {identity?.fullName ?? 'Sin nombre'}
            </h1>
            {patient.dischargedAt && (
              <Badge variant="secondary">
                Seguimiento finalizado el {formatDate(patient.dischargedAt)}
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground">{patient.diagnosis}</p>
        </div>
        <div className="flex gap-2">
          <EditPatientDialog patient={patient} />
          <DischargeButton patient={patient} />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Section title="Datos personales">
          <InfoRow label="Fecha de nacimiento">
            {identity &&
              `${formatDate(identity.birthDate)} (${ageFromBirthDate(identity.birthDate)} años)`}
          </InfoRow>
          <InfoRow label="Sexo">
            {patient.sex && sexLabels[patient.sex]}
          </InfoRow>
          <InfoRow label="Teléfono">{identity?.phone}</InfoRow>
          <InfoRow label="DNI/NIE">{identity?.nationalId}</InfoRow>
          {user?.role === 'ADMIN' && (
            <InfoRow label="Fisioterapeuta">
              {patient.physiotherapist.fullName}
            </InfoRow>
          )}
        </Section>

        <Section title="Datos clínicos">
          <InfoRow label="Diagnóstico">{patient.diagnosis}</InfoRow>
          <InfoRow label="Estadio">{patient.stage}</InfoRow>
          <InfoRow label="Tratamiento actual">
            {patient.currentTreatment}
          </InfoRow>
          <InfoRow label="Fecha de cirugía">
            {patient.surgeryDate && formatDate(patient.surgeryDate)}
          </InfoRow>
          <InfoRow label="Peso">
            {patient.weightKg !== null && `${patient.weightKg} kg`}
          </InfoRow>
          <InfoRow label="Altura">
            {patient.heightCm !== null && `${patient.heightCm} cm`}
          </InfoRow>
          <InfoRow label="Comorbilidades">
            {patient.comorbidities.length > 0 &&
              patient.comorbidities.join(', ')}
          </InfoRow>
        </Section>
      </div>

      <PatientProgramSection patient={patient} />

      <PatientAppSection patient={patient} />

      <Section title="Valoración inicial">
        {patient.initialAssessment ? (
          <p className="whitespace-pre-line">{patient.initialAssessment}</p>
        ) : (
          <p className="text-muted-foreground">Sin valoración registrada.</p>
        )}
      </Section>
    </div>
  );
}

// UI wording: "Finalizar seguimiento" instead of "Dar de alta", because in Spanish
// "alta" also means signing up, which is the opposite.

/** "Finalizar seguimiento" (with confirmation) or "Reanudar seguimiento", depending on the patient's state */
function DischargeButton({ patient }: { patient: Patient }) {
  const discharge = useDischargePatient(patient.id);
  const reactivate = useReactivatePatient(patient.id);

  if (patient.dischargedAt) {
    return (
      <Button
        variant="outline"
        disabled={reactivate.isPending}
        onClick={() => reactivate.mutate()}
      >
        Reanudar seguimiento
      </Button>
    );
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" disabled={discharge.isPending}>
          Finalizar seguimiento
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            ¿Finalizar el seguimiento de este paciente?
          </AlertDialogTitle>
          <AlertDialogDescription>
            Dejará de recibir ejercicios y no podrá usar la app. Pasará a la
            lista de finalizados. Sus datos se conservan y puedes reanudar el
            seguimiento cuando quieras.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={() => discharge.mutate()}>
            Finalizar seguimiento
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function BackLink() {
  return (
    <Link
      to="/patients"
      className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft className="size-4" />
      Pacientes
    </Link>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-lg border p-5">
      <h2 className="mb-4 font-semibold">{title}</h2>
      {children}
    </section>
  );
}

/** One "label: value" line. Empty values show a dash. */
function InfoRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[10rem_1fr] gap-2 py-1.5 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd>{children || '—'}</dd>
    </div>
  );
}
